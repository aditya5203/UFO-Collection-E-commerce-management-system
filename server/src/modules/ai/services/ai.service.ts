async function getGradioClient(): Promise<any> {
  return await Function("return import('@gradio/client')")();
}

type GarmentCategory = "tops" | "bottoms" | "one-pieces" | "shoes";

type RunTryOnInput = {
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
  mirrorMode?: boolean;
  garmentCategory?: GarmentCategory;
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

type TryOnProvider = "huhu" | "pincel" | "replicate" | "huggingface" | "demo";

type RunTryOnResult = {
  imageUrl: string;
  provider: TryOnProvider;
  warning?: string;
};

type HuggingFaceSpaceType = "fashn" | "kolors";

type HuggingFaceSpaceConfig = {
  id: string;
  apiName: string;
  type: HuggingFaceSpaceType;
};

const DEFAULT_HF_SPACES: HuggingFaceSpaceConfig[] = [
  {
    id: "Kwai-Kolors/Kolors-Virtual-Try-On",
    apiName: "/tryon",
    type: "kolors",
  },
  {
    id: "fashn-ai/fashn-vton-1.5",
    apiName: "/try_on",
    type: "fashn",
  },
];

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

function isHuhuConfigured() {
  return Boolean(process.env.HUHU_API_KEY && process.env.HUHU_TRYON_URL);
}

function isPincelConfigured() {
  return Boolean(
    process.env.PINCEL_API_KEY && process.env.PINCEL_CLOTHES_SWAP_URL
  );
}

function isReplicateConfigured() {
  return Boolean(
    process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_IDM_VTON_VERSION
  );
}

function normalizeGarmentCategory(value: any): GarmentCategory {
  const clean = String(value || "").trim().toLowerCase();

  if (clean === "bottoms" || clean === "lower_body") return "bottoms";

  if (
    clean === "one-pieces" ||
    clean === "one_pieces" ||
    clean === "one pieces" ||
    clean === "onepiece" ||
    clean === "dress" ||
    clean === "dresses"
  ) {
    return "one-pieces";
  }

  if (clean === "shoes" || clean === "shoe" || clean === "footwear") {
    return "shoes";
  }

  return "tops";
}

function toPincelCategory(value: any) {
  const category = normalizeGarmentCategory(value);

  if (category === "bottoms") return "lower_body";
  if (category === "one-pieces") return "dresses";

  return "upper_body";
}

function normalizeSpaceType(value: any): HuggingFaceSpaceType {
  const clean = String(value || "").trim().toLowerCase();

  if (clean === "kolors") return "kolors";

  return "fashn";
}

function guessSpaceType(spaceId: string, fallback: HuggingFaceSpaceType) {
  const clean = spaceId.toLowerCase();

  if (clean.includes("kolors")) return "kolors";
  if (clean.includes("fashn")) return "fashn";

  return fallback;
}

function getHuggingFaceSpaces(): HuggingFaceSpaceConfig[] {
  const primaryId = getEnv("HF_SPACE_ID", "Kwai-Kolors/Kolors-Virtual-Try-On");
  const primaryType = normalizeSpaceType(getEnv("HF_SPACE_TYPE", "kolors"));

  const primaryApi = getEnv(
    "HF_SPACE_API_NAME",
    primaryType === "kolors" ? "/tryon" : "/try_on"
  );

  const backupIds = getEnv("HF_BACKUP_SPACE_IDS", "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const spaces: HuggingFaceSpaceConfig[] = [
    {
      id: primaryId,
      apiName: primaryApi,
      type: primaryType,
    },
    ...backupIds.map((id) => {
      const type = guessSpaceType(id, "fashn");

      return {
        id,
        apiName: type === "kolors" ? "/tryon" : "/try_on",
        type,
      };
    }),
  ];

  const unique = new Map<string, HuggingFaceSpaceConfig>();

  for (const space of spaces.length ? spaces : DEFAULT_HF_SPACES) {
    unique.set(`${space.id}:${space.apiName}:${space.type}`, space);
  }

  return Array.from(unique.values());
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

async function imageUrlToBase64(url: string) {
  const res = await withTimeout(
    fetch(url),
    30000,
    "HuHu image download"
  );

  if (!res.ok) {
    throw new Error(`Failed to download image for HuHu: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    throw new Error(`HuHu image download returned invalid type: ${contentType}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return buffer.toString("base64");
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
    const directKeys = [
      "url",
      "path",
      "orig_name",
      "name",
      "image",
      "image_url",
      "imageUrl",
      "output",
      "output_url",
      "outputUrl",
      "result",
      "result_url",
      "resultUrl",
    ];

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
    text.includes("building") ||
    text.includes("queue") ||
    text.includes("too busy") ||
    text.includes("capacity")
  );
}

async function runHuhuTryOn({
  personImageUrl,
  garmentImageUrl,
}: RunTryOnInput): Promise<RunTryOnResult> {
  if (!isHuhuConfigured()) {
    throw new Error("HuHu AI is not configured");
  }

  const apiKey = ensureEnv("HUHU_API_KEY");
  const endpoint = ensureEnv("HUHU_TRYON_URL");

  const modelBase64 = await imageUrlToBase64(personImageUrl);
  const garmentBase64 = await imageUrlToBase64(garmentImageUrl);

  const startRes = await withTimeout(
    fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_images: [{ base64: modelBase64 }],
        garment_images: [{ base64: garmentBase64 }],
        num_output_images: 1,
      }),
    }),
    60000,
    "HuHu quick try-on start"
  );

  const startData: any = await startRes.json().catch(() => ({}));

  if (!startRes.ok) {
    console.error("HuHu start status:", startRes.status);
    console.error("HuHu start response:", startData);

    throw new Error(
      startData?.message ||
        startData?.error ||
        startData?.detail ||
        `HuHu start failed with status ${startRes.status}`
    );
  }

  const projectId =
    startData?.project_id ||
    startData?.projectId ||
    startData?.project?.id;

  const firstTask = Array.isArray(startData?.tasks)
    ? startData.tasks[0]
    : null;

  const tryonId =
    firstTask?.tryon_id ||
    firstTask?.tryonId ||
    startData?.tryon_id ||
    startData?.tryonId;

  if (!projectId || !tryonId) {
    console.error("HuHu start response missing IDs:", startData);
    throw new Error("HuHu project_id or tryon_id missing");
  }

  for (let i = 0; i < 40; i++) {
    await sleep(3000);

    const pollUrl = `${endpoint}?tryon_id=${encodeURIComponent(
      tryonId
    )}&project_id=${encodeURIComponent(projectId)}`;

    const pollRes = await withTimeout(
      fetch(pollUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
      30000,
      "HuHu quick try-on poll"
    );

    const pollData: any = await pollRes.json().catch(() => ({}));

    if (!pollRes.ok) {
      console.error("HuHu poll status:", pollRes.status);
      console.error("HuHu poll response:", pollData);

      throw new Error(
        pollData?.message ||
          pollData?.error ||
          pollData?.detail ||
          `HuHu polling failed with status ${pollRes.status}`
      );
    }

    const status = String(
      pollData?.status || pollData?.task?.status || ""
    ).toLowerCase();

    if (
      status === "succeeded" ||
      status === "success" ||
      status === "completed" ||
      status === "complete"
    ) {
      const imageUrl =
        pollData?.output_images?.[0]?.image_url ||
        pollData?.output_images?.[0]?.url ||
        pollData?.images?.[0]?.image_url ||
        pollData?.images?.[0]?.url ||
        findFirstUrl(pollData);

      if (!imageUrl) {
        console.error("HuHu completed but no image:", pollData);
        throw new Error("HuHu returned no output image");
      }

      return {
        imageUrl: String(imageUrl),
        provider: "huhu",
      };
    }

    if (
      status === "failed" ||
      status === "error" ||
      status === "canceled" ||
      status === "cancelled"
    ) {
      throw new Error(
        pollData?.message || pollData?.error || "HuHu generation failed"
      );
    }
  }

  throw new Error("HuHu timed out");
}

async function runPincelTryOn({
  personImageUrl,
  garmentImageUrl,
  garmentCategory = "tops",
}: RunTryOnInput): Promise<RunTryOnResult> {
  if (!isPincelConfigured()) {
    throw new Error("Pincel is not configured");
  }

  const apiKey = ensureEnv("PINCEL_API_KEY");
  const endpoint = ensureEnv("PINCEL_CLOTHES_SWAP_URL");
  const category = toPincelCategory(garmentCategory);

  const startRes = await withTimeout(
    fetch(endpoint, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_image: personImageUrl,
        garment_image: garmentImageUrl,
        category,
        action: "startPrediction",
      }),
    }),
    60000,
    "Pincel start prediction"
  );

  const startData: any = await startRes.json().catch(() => ({}));

  if (!startRes.ok) {
    throw new Error(
      startData?.message ||
        startData?.error ||
        startData?.detail ||
        "Pincel start prediction failed"
    );
  }

  const predictionId =
    startData?.prediction ||
    startData?.predictionId ||
    startData?.id ||
    startData?.data?.prediction ||
    startData?.data?.predictionId;

  if (!predictionId) {
    throw new Error("Pincel prediction ID missing");
  }

  for (let i = 0; i < 40; i++) {
    await sleep(3000);

    const pollRes = await withTimeout(
      fetch(endpoint, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictionId,
          action: "getPrediction",
        }),
      }),
      30000,
      "Pincel poll prediction"
    );

    const pollData: any = await pollRes.json().catch(() => ({}));

    if (!pollRes.ok) {
      throw new Error(
        pollData?.message ||
          pollData?.error ||
          pollData?.detail ||
          "Pincel polling failed"
      );
    }

    const status = String(pollData?.status || "").toLowerCase();

    if (
      status === "succeeded" ||
      status === "success" ||
      status === "completed"
    ) {
      const output = pollData?.output || pollData?.result || pollData?.image;

      const imageUrl =
        Array.isArray(output) && output.length > 0
          ? output[0]
          : findFirstUrl(output) || findFirstUrl(pollData);

      if (!imageUrl) {
        throw new Error("Pincel returned no output image");
      }

      return {
        imageUrl: String(imageUrl),
        provider: "pincel",
      };
    }

    if (status === "failed" || status === "canceled" || status === "cancelled") {
      throw new Error(
        pollData?.message || pollData?.error || "Pincel generation failed"
      );
    }
  }

  throw new Error("Pincel timed out");
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

  const created: ReplicatePrediction =
    (await createRes.json().catch(() => ({}))) || {};

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

    const polled: ReplicatePrediction =
      (await pollRes.json().catch(() => ({}))) || {};

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

async function predictOnFashnHuggingFace(
  app: any,
  apiName: string,
  personImageUrl: string,
  garmentImageUrl: string,
  garmentCategory: GarmentCategory
) {
  const { handle_file } = await getGradioClient();

  return withTimeout(
    app.predict(apiName, [
      await handle_file(personImageUrl),
      await handle_file(garmentImageUrl),
      normalizeGarmentCategory(garmentCategory),
      "model",
      50,
      2.0,
      42,
      true,
    ]),
    180000,
    "FASHN Hugging Face predict"
  );
}

async function predictOnKolorsHuggingFace(
  app: any,
  apiName: string,
  personImageUrl: string,
  garmentImageUrl: string
) {
  const { handle_file } = await getGradioClient();

  return withTimeout(
    app.predict(apiName, [
      await handle_file(personImageUrl),
      await handle_file(garmentImageUrl),
      42,
      true,
    ]),
    180000,
    "Kolors Hugging Face predict"
  );
}

async function runSingleHuggingFaceSpace(
  space: HuggingFaceSpaceConfig,
  input: RunTryOnInput
): Promise<RunTryOnResult> {
  const { Client } = await getGradioClient();

  const hfToken = getEnv("HF_TOKEN", "");
  const safeCategory = normalizeGarmentCategory(input.garmentCategory);

  const connectOptions = hfToken
    ? {
        token: hfToken,
        status_callback: (status: any) => {
          console.log(`[HF Space status: ${space.id}]`, status);
        },
      }
    : {
        status_callback: (status: any) => {
          console.log(`[HF Space status: ${space.id}]`, status);
        },
      };

  const app = await withTimeout(
    Client.connect(space.id, connectOptions as any),
    30000,
    `Hugging Face connect ${space.id}`
  );

  const result =
    space.type === "kolors"
      ? await predictOnKolorsHuggingFace(
          app,
          space.apiName,
          input.personImageUrl,
          input.garmentImageUrl
        )
      : await predictOnFashnHuggingFace(
          app,
          space.apiName,
          input.personImageUrl,
          input.garmentImageUrl,
          safeCategory
        );

  console.log(
    `[HF raw result: ${space.id} (${space.type})]`,
    JSON.stringify(result, null, 2)
  );

  const rawUrl = findFirstUrl((result as any)?.data) || findFirstUrl(result);

  if (!rawUrl) {
    throw new Error(`Hugging Face returned no output image from ${space.id}`);
  }

  return {
    imageUrl: normalizeHuggingFaceResultUrl(rawUrl, space.id),
    provider: "huggingface",
  };
}

async function runHuggingFaceTryOn(
  input: RunTryOnInput
): Promise<RunTryOnResult> {
  const spaces = getHuggingFaceSpaces();

  if (!spaces.length) {
    throw new Error("No Hugging Face Spaces configured");
  }

  const errors: string[] = [];

  for (const space of spaces) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `[HF] Trying ${space.id} ${space.apiName} (${space.type}) attempt ${attempt}`
        );

        return await runSingleHuggingFaceSpace(space, input);
      } catch (error: any) {
        const message = error?.message || "Hugging Face failed";
        const fullMessage = `${space.id} attempt ${attempt}: ${message}`;

        errors.push(fullMessage);
        console.error("Hugging Face try-on failed:", fullMessage);

        if (attempt < 2 && isRetriableHuggingFaceError(message)) {
          await sleep(4000);
          continue;
        }

        break;
      }
    }
  }

  throw new Error(errors.join(" | ") || "All Hugging Face Spaces failed");
}

export const aiService = {
  async runTryOn(input: RunTryOnInput): Promise<RunTryOnResult> {
    const errors: string[] = [];

    try {
      return await runHuhuTryOn(input);
    } catch (error: any) {
      const message = error?.message || "HuHu AI failed";
      errors.push(`HuHu AI: ${message}`);
      console.error("HuHu AI try-on failed:", message);
    }

    try {
      return await runPincelTryOn(input);
    } catch (error: any) {
      const message = error?.message || "Pincel failed";
      errors.push(`Pincel: ${message}`);
      console.error("Pincel try-on failed:", message);
    }

    try {
      return await runReplicateTryOn(input);
    } catch (error: any) {
      const message = error?.message || "Replicate failed";
      errors.push(`Replicate: ${message}`);
      console.error("Replicate try-on failed:", message);
    }

    try {
      return await runHuggingFaceTryOn(input);
    } catch (error: any) {
      const message = error?.message || "Hugging Face failed";
      errors.push(`Hugging Face: ${message}`);
      console.error("Hugging Face try-on failed:", message);
    }

    const demoImage =
      getEnv("AI_TRYON_DEMO_IMAGE") ||
      "https://res.cloudinary.com/demo/image/upload/sample.jpg";

    return {
      imageUrl: demoImage,
      provider: "demo",
      warning:
        "AI try-on preview mode is active because live AI providers are currently unavailable. " +
        errors.join(" | "),
    };
  },
};