// server/src/app.ts
import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import { getConnectionStatus } from "./config/database";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app: Application = express();

// ✅ IMPORTANT for production behind proxy (Render/Railway/Nginx/etc)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* ----------------------------------------------------
 * Security Middleware
 * --------------------------------------------------*/
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        // Swagger UI needs inline styles/scripts
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

        // allow images for swagger + normal usage
        imgSrc: ["'self'", "data:", "https:"],

        // optional: swagger might fetch json/spec
        connectSrc: ["'self'"],

        // ✅ allow posting payment form to eSewa domains
        formAction: [
          "'self'",
          "https://rc-epay.esewa.com.np",
          "https://epay.esewa.com.np",
          "https://uat.esewa.com.np",
        ],
      },
    },
  })
);

/* ----------------------------------------------------
 * CORS (cookies)
 * --------------------------------------------------*/
// ✅ normalize origins so "http://localhost:3000/" matches "http://localhost:3000"
const normalizeOrigin = (s: string) => s.trim().replace(/\/$/, "");

const origins = (process.env.CLIENT_BASE_URL || "http://localhost:3000")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // ✅ allow Postman / server-to-server (no origin header)
      if (!origin) return cb(null, true);

      const o = normalizeOrigin(origin);

      if (origins.includes(o)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------------------------------
 * Static: Serve Uploaded Images
 * --------------------------------------------------*/
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

/* ----------------------------------------------------
 * Swagger Documentation
 * --------------------------------------------------*/
app.use(
  "/ufo-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "UFO Collection API Documentation",
  })
);

/* ----------------------------------------------------
 * Health Check
 * --------------------------------------------------*/
app.get("/health", (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();

  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? "OK" : "DEGRADED",
    message: dbStatus
      ? "Server and database are running"
      : "Server is running but database is disconnected",
    timestamp: new Date().toISOString(),
    services: {
      server: "running",
      database: dbStatus ? "connected" : "disconnected",
    },
  });
});

/* ----------------------------------------------------
 * API Routes
 * --------------------------------------------------*/
app.use("/api", apiRoutes);

/* ----------------------------------------------------
 * 404 Handler
 * --------------------------------------------------*/
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/* ----------------------------------------------------
 * Global Error Handler
 * --------------------------------------------------*/
app.use(errorHandler);

export default app;
