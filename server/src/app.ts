// server/src/app.ts
import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import { getConnectionStatus } from "./config/database";

// Load environment variables
dotenv.config();

const app: Application = express();

// ----------------------------------------------------
// Core middleware / security
// ----------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: true, // allow all origins in dev; restrict in prod
    credentials: true, // allow cookies
  })
);

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// Swagger documentation
// ----------------------------------------------------
app.use(
  "/ufo-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "UFO Collection API Documentation",
  })
);

// ----------------------------------------------------
// Health check
// ----------------------------------------------------
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the server and database
 *     tags: [Health]
 */
app.get("/health", (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();

  const healthStatus = {
    status: dbStatus ? "OK" : "DEGRADED",
    message: dbStatus
      ? "Server and database are running"
      : "Server is running but database is disconnected",
    timestamp: new Date().toISOString(),
    services: {
      server: "running",
      database: dbStatus ? "connected" : "disconnected",
    },
  };

  res.status(dbStatus ? 200 : 503).json(healthStatus);
});

// ----------------------------------------------------
// API routes
// ----------------------------------------------------
import apiRoutes from "./routes";
app.use("/api", apiRoutes);

// ----------------------------------------------------
// 404 handler
// ----------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ----------------------------------------------------
// Global error handler
// ----------------------------------------------------
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 SERVER ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        error: err.message,
        stack: err.stack,
      }),
    });
  }
);

export default app;
