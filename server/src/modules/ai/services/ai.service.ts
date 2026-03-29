import { Client, handle_file } from "@gradio/client";

type RunTryOnInput = {
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractOutputImage(data: ReplicatePrediction) {
  const output = data?.output;

  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);

  return null;
}

function extractErrorMessage(data: Partial<ReplicatePrediction>, fallback: string) {
  return data?.detail || data?.title || data?.message || data?.error || fallback;
}

function findFirstUrl(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
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
    if (typeof value.url === "string") return value.url;
    if (typeof value.path === "string") return value.path;

    for (const nested of Object.values(value)) {
      const found = findFirstUrl(nested);
      if (found) return found;
    }
  }

  return null;
}

async function runReplicateTryOn({
  personImageUrl,
  garmentImageUrl,
  garmentDescription = "fashion clothing",
}: RunTryOnInput): Promise<RunTryOnResult> {
  const token = ensureEnv("REPLICATE_API_TOKEN");
  const version = ensureEnv("REPLICATE_IDM_VTON_VERSION");

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
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
  });

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

  for (let i = 0; i < 20; i++) {
    await sleep(2500);

    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const polled = ((await pollRes.json().catch(() => ({}))) ||
      {}) as ReplicatePrediction;

    if (!pollRes.ok) {
      throw new Error(
        extractErrorMessage(polled, "Replicate polling failed")
      );
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

async function runHuggingFaceTryOn({
  personImageUrl,
  garmentImageUrl,
  garmentDescription = "fashion clothing",
}: RunTryOnInput): Promise<RunTryOnResult> {
  const spaceId = getEnv("HF_SPACE_ID", "yisol/IDM-VTON");
  const apiName = getEnv("HF_SPACE_API_NAME", "/tryon");
  const hfToken = getEnv("HF_TOKEN", "");

  const app = await Client.connect(
    spaceId,
    hfToken ? { hf_token: hfToken } : undefined
  );

  const result = await app.predict(apiName, [
    {
      background: await handle_file(personImageUrl),
      layers: [],
      composite: null,
    },
    await handle_file(garmentImageUrl),
    garmentDescription,
    true,
    false,
    30,
    42,
  ]);

  const imageUrl =
    findFirstUrl((result as any)?.data) ||
    findFirstUrl(result);

  if (!imageUrl) {
    throw new Error("Hugging Face returned no output image");
  }

  return {
    imageUrl,
    provider: "huggingface",
  };
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