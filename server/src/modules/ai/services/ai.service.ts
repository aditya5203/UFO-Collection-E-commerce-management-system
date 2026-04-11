import { Client, handle_file } from "@gradio/client";

type RunTryOnInput = {
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
  mirrorMode?: boolean;
};

type ReplicatePrediction = {
  id?: string;
  status?: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  detail?: string;
  title?: string;
  message?: string;
};

type TryOnProvider = "replicate" | "huggingface" | "demo";

type RunTryOnResult = {
  imageUrl: string;
  provider: TryOnProvider;
  warning?: string;
};

function ensureEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing in environment variables`);
  }
  return value;
}

function getEnv(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function isReplicateConfigured() {
  return Boolean(
    process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_IDM_VTON_VERSION
  );
}

function isHuggingFaceConfigured() {
  return Boolean(getEnv("HF_SPACE_ID", "yisol/IDM-VTON"));
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;

  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}

function extractOutputImage(data: ReplicatePrediction) {
  const output = data?.output;

  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);

  return null;
}

function extractErrorMessage(
  data: Partial<ReplicatePrediction>,
  fallback: string
) {
  return data?.detail || data?.title || data?.message || data?.error || fallback;
}

function findFirstUrl(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/")
    ) {
      return value;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const directKeys = ["url", "path", "orig_name", "name"];

    for (const key of directKeys) {
      const val = value?.[key];
      if (
        typeof val === "string" &&
        (val.startsWith("http://") ||
          val.startsWith("https://") ||
          val.startsWith("/"))
      ) {
        return val;
      }
    }

    for (const nested of Object.values(value)) {
      const found = findFirstUrl(nested);
      if (found) return found;
    }
  }

  return null;
}

function normalizeHuggingFaceResultUrl(url: string, spaceId: string) {
  if (!url) return url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const appHost = `https://${spaceId.replace("/", "-")}.hf.space`;

  if (url.startsWith("/")) return `${appHost}${url}`;
  return `${appHost}/${url}`;
}

function isRetriableHuggingFaceError(message: string) {
  const text = (message || "").toLowerCase();

  return (
    text.includes("config_error") ||
    text.includes("runtime_error") ||
    text.includes("build_error") ||
    text.includes("space_error") ||
    text.includes("could not resolve app config") ||
    text.includes("fetch failed") ||
    text.includes("timed out") ||
    text.includes("network") ||
    text.includes("503") ||
    text.includes("loading") ||
    text.includes("sleeping") ||
    text.includes("building")
  );
}

async function runReplicateTryOn({
  personImageUrl,
  garmentImageUrl,
  garmentDescription = "fashion clothing",
}: RunTryOnInput): Promise<RunTryOnResult> {
  if (!isReplicateConfigured()) {
    throw new Error("Replicate is not configured");
  }

  const token = ensureEnv("REPLICATE_API_TOKEN");
  const version = ensureEnv("REPLICATE_IDM_VTON_VERSION");

  const createRes = await withTimeout(
    fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version,
        input: {
          human_img: personImageUrl,
          garm_img: garmentImageUrl,
          garment_des: garmentDescription,
        },
      }),
    }),
    30000,
    "Replicate create"
  );

  const created = ((await createRes.json().catch(() => ({}))) ||
    {}) as ReplicatePrediction;

  if (!createRes.ok) {
    throw new Error(
      extractErrorMessage(created, "Replicate prediction creation failed")
    );
  }

  if (created.status === "succeeded") {
    const image = extractOutputImage(created);
    if (image) {
      return {
        imageUrl: image,
        provider: "replicate",
      };
    }
    throw new Error("Replicate succeeded but no output image was returned");
  }

  const predictionId = created.id;

  if (!predictionId) {
    const image = extractOutputImage(created);
    if (image) {
      return {
        imageUrl: image,
        provider: "replicate",
      };
    }
    throw new Error("Replicate prediction id missing");
  }

  for (let i = 0; i < 24; i++) {
    await sleep(2500);

    const pollRes = await withTimeout(
      fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }),
      20000,
      "Replicate poll"
    );

    const polled = ((await pollRes.json().catch(() => ({}))) ||
      {}) as ReplicatePrediction;

    if (!pollRes.ok) {
      throw new Error(extractErrorMessage(polled, "Replicate polling failed"));
    }

    if (polled.status === "succeeded") {
      const image = extractOutputImage(polled);
      if (image) {
        return {
          imageUrl: image,
          provider: "replicate",
        };
      }
      throw new Error("Replicate succeeded but no output image was returned");
    }

    if (polled.status === "failed" || polled.status === "canceled") {
      throw new Error(polled.error || "AI try-on failed on Replicate");
    }
  }

  throw new Error("AI try-on timed out. Please try again.");
}

async function predictOnHuggingFace(
  app: any,
  apiName: string,
  personImageUrl: string,
  garmentImageUrl: string,
  garmentDescription: string
) {
  const enableAutoMask = getEnv("HF_TRYON_AUTOMASK", "true") === "true";
  const enableCrop = getEnv("HF_TRYON_CROP", "false") === "true";
  const steps = Number(getEnv("HF_TRYON_STEPS", "30"));
  const seed = Number(getEnv("HF_TRYON_SEED", "42"));

  return withTimeout(
    app.predict(apiName, [
      {
        background: await handle_file(personImageUrl),
        layers: [],
        composite: null,
      },
      await handle_file(garmentImageUrl),
      garmentDescription,
      enableAutoMask,
      enableCrop,
      steps,
      seed,
    ]),
    90000,
    "Hugging Face predict"
  );
}

async function runHuggingFaceTryOn({
  personImageUrl,
  garmentImageUrl,
  garmentDescription = "fashion clothing",
}: RunTryOnInput): Promise<RunTryOnResult> {
  if (!isHuggingFaceConfigured()) {
    throw new Error("Hugging Face is not configured");
  }

  const spaceId = getEnv("HF_SPACE_ID", "yisol/IDM-VTON");
  const apiName = getEnv("HF_SPACE_API_NAME", "/tryon");
  const hfToken = getEnv("HF_TOKEN", "");

  let lastError = "Unknown Hugging Face error";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const connectOptions = hfToken
        ? {
            token: hfToken,
            status_callback: (status: any) => {
              console.log("[HF Space status]", status);
            },
          }
        : {
            status_callback: (status: any) => {
              console.log("[HF Space status]", status);
            },
          };

      const app = await withTimeout(
        Client.connect(spaceId, connectOptions as any),
        30000,
        `Hugging Face connect (attempt ${attempt})`
      );

      const result = await predictOnHuggingFace(
        app,
        apiName,
        personImageUrl,
        garmentImageUrl,
        garmentDescription
      );

      console.log("[HF raw result]", JSON.stringify(result, null, 2));

      const rawUrl = findFirstUrl((result as any)?.data) || findFirstUrl(result);

      if (!rawUrl) {
        throw new Error("Hugging Face returned no output image");
      }

      return {
        imageUrl: normalizeHuggingFaceResultUrl(rawUrl, spaceId),
        provider: "huggingface",
      };
    } catch (error: any) {
      lastError = error?.message || "Hugging Face failed";
      console.error(`Hugging Face try-on failed (attempt ${attempt}):`, lastError);

      if (attempt < 2 && isRetriableHuggingFaceError(lastError)) {
        await sleep(4000);
        continue;
      }

      break;
    }
  }

  throw new Error(lastError);
}

export const aiService = {
  async runTryOn(input: RunTryOnInput): Promise<RunTryOnResult> {
    let replicateError = "";
    let huggingFaceError = "";

    try {
      return await runReplicateTryOn(input);
    } catch (error: any) {
      replicateError = error?.message || "Replicate failed";
      console.error("Replicate try-on failed:", replicateError);
    }

    try {
      return await runHuggingFaceTryOn(input);
    } catch (error: any) {
      huggingFaceError = error?.message || "Hugging Face failed";
      console.error("Hugging Face try-on failed:", huggingFaceError);
    }

    const demoImage =
      getEnv("AI_TRYON_DEMO_IMAGE") ||
      "https://res.cloudinary.com/demo/image/upload/sample.jpg";

    return {
      imageUrl: demoImage,
      provider: "demo",
      warning: `Replicate failed: ${replicateError}. Hugging Face failed: ${huggingFaceError}. Demo fallback used.`,
    };
  },
};