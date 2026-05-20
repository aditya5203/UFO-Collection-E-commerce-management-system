import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on("error", () => {
  console.warn("⚠️ Redis unavailable. Running without cache.");
});

export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Redis connected");
    }
  } catch {
    console.warn("⚠️ Redis not connected. App will run without cache.");
  }
}

export async function disconnectRedis() {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log("✅ Redis disconnected");
    }
  } catch {
    // ignore
  }
}