const LOCAL_API_BASE_URL = "http://localhost:8080";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function stripApiSuffix(value: string) {
  return value.replace(/\/api\/?$/, "");
}

const isProduction = process.env.NODE_ENV === "production";

const publicApiBaseUrl = stripTrailingSlash(
  String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim()
);
const publicApiUrl = stripTrailingSlash(
  String(process.env.NEXT_PUBLIC_API_URL || "").trim()
);
const developmentFallbackBase = isProduction ? "" : LOCAL_API_BASE_URL;

export const API_BASE_URL =
  publicApiBaseUrl ||
  (publicApiUrl ? stripApiSuffix(publicApiUrl) : "") ||
  developmentFallbackBase;

export const API_URL =
  publicApiUrl ||
  (API_BASE_URL ? `${API_BASE_URL}/api` : "") ||
  (developmentFallbackBase ? `${developmentFallbackBase}/api` : "");

export function joinUrl(base: string, path: string) {
  const b = stripTrailingSlash(base);
  const p = path.replace(/^\/+/, "");
  return b ? `${b}/${p}` : `/${p}`;
}
