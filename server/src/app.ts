// server/src/app.ts

import express, { Application } from "express";
import path from "path"; // ⭐ For static uploads
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import { getConnectionStatus } from "./config/database";
import apiRoutes from "./routes"; // ⭐ Central API router
import { errorHandler } from "./middleware/error.middleware";

// Load env variables
dotenv.config();

const app: Application = express();

/* ----------------------------------------------------
 * Security Middleware
 * --------------------------------------------------*/
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
    origin: true,
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
// Files in server/public/uploads → http://localhost:8080/uploads/<filename>
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../public/uploads"))
);

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

  const response = {
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

  res.status(dbStatus ? 200 : 503).json(response);
});

/* ----------------------------------------------------
 * API Routes
 * --------------------------------------------------*/
// All module routes (auth, products, categories, etc.) are mounted here
app.use("/api", apiRoutes);

/* ----------------------------------------------------
 * 404 Handler
 * --------------------------------------------------*/
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ----------------------------------------------------
 * Global Error Handler
 * --------------------------------------------------*/
app.use(errorHandler);

export default app;
