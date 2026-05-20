import { config } from "./index";

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => normalizeUrl(item))
    .filter(Boolean);
}

const defaultClientBaseUrl =
  config.nodeEnv === "production" ? "" : "http://localhost:3000";
const defaultServerBaseUrl =
  config.nodeEnv === "production" ? "" : "http://localhost:8080";

export const clientBaseUrl = normalizeUrl(
  process.env.CLIENT_BASE_URL || process.env.FRONTEND_URL || defaultClientBaseUrl
);

export const serverBaseUrl = normalizeUrl(
  process.env.SERVER_BASE_URL ||
    process.env.PUBLIC_API_BASE_URL ||
    defaultServerBaseUrl
);

export const allowedClientOrigins = splitCsv(
  process.env.CLIENT_BASE_URL || process.env.FRONTEND_URL || defaultClientBaseUrl
);

export function getCookieOptions() {
  const isProd = config.nodeEnv === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
