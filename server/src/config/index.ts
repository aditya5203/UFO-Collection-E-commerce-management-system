//server/src/config/index.ts
import dotenv from "dotenv";

dotenv.config();

// Export config
export const config = Object.freeze({
  port: parseInt(process.env.PORT || "8080", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  mongoUrl:
    process.env.MONGO_URI || process.env.MONGO_URL || "",

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",  // MUST match your .env
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  clientBaseUrl:
    process.env.CLIENT_BASE_URL ||
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000"),
});
