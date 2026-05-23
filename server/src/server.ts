import { createServer } from "http";
import app from "./app";
import { config } from "./config";
import {
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus,
} from "./config/database";
import mongoose from "mongoose";
import { initSocket } from "./socket";
import { connectRedis, disconnectRedis } from "./config/redis";
import { serverBaseUrl } from "./config/runtime";

const startServer = async () => {
  try {
    await connectDatabase();

    // Redis cache connection
    await connectRedis();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.port, () => {
      const dbStatus = getConnectionStatus();
      const dbName = mongoose.connection.name || "unknown";

      console.log("\n" + "=".repeat(50));
      console.log("🚀 BACKEND STATUS");
      console.log("=".repeat(50));
      console.log(`✅ Server: Running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔌 Database: ${dbStatus ? "✅ Connected" : "❌ Disconnected"}`);

      if (dbStatus) {
        console.log(`📊 Database Name: ${dbName}`);
      }

      console.log(
        `📚 Swagger API: ${
          serverBaseUrl || `http://localhost:${config.port}`
        }/ufo-docs`
      );
      console.log("🔔 Socket.IO: Enabled");
      console.log("=".repeat(50) + "\n");
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} signal received: shutting down gracefully...`);

      httpServer.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          await disconnectDatabase();
          await disconnectRedis();

          console.log("✅ Database disconnected");
          console.log("✅ Redis disconnected");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("⚠️  Forcing shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();