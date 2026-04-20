import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config";

type SocketUser = {
  userId: string;
  email?: string;
  role?: string;
};

let io: SocketIOServer | null = null;

function parseCookies(cookieHeader?: string) {
  const out: Record<string, string> = {};

  if (!cookieHeader) return out;

  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;

    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());

    out[key] = value;
  }

  return out;
}

export function initSocket(server: HTTPServer) {
  const allowedOrigins = (process.env.CLIENT_BASE_URL || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);

      const adminCookieName = process.env.ADMIN_COOKIE_NAME || "adminToken";
      const customerCookieName = process.env.COOKIE_NAME || "token";
      const deliveryCookieName =
        process.env.DELIVERY_COOKIE_NAME || "deliveryToken";

      const adminToken = cookies[adminCookieName];
      const customerToken = cookies[customerCookieName];
      const deliveryToken = cookies[deliveryCookieName];

      const token = adminToken || customerToken || deliveryToken;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId?: string;
        email?: string;
        role?: string;
      };

      const userId = String(decoded.userId || "").trim();
      const email = String(decoded.email || "").trim();
      const role = String(decoded.role || "").trim().toLowerCase();

      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = {
        userId,
        email,
        role,
      } as SocketUser;

      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket.data.user || {}) as SocketUser;
    const userId = String(user.userId || "").trim();
    const role = String(user.role || "").trim().toLowerCase();

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (userId && (role === "admin" || role === "superadmin")) {
      socket.join(`admin:${userId}`);
      socket.join("admins");
      console.log(`🔔 Admin socket connected: ${userId} (${role})`);
    } else if (userId && role === "delivery") {
      socket.join(`delivery:${userId}`);
      console.log(`🔔 Delivery socket connected: ${userId}`);
    } else {
      console.log(`🔔 Customer socket connected: ${userId || "unknown"}`);
    }

    socket.on("disconnect", () => {
      if (role === "admin" || role === "superadmin") {
        console.log(`🔕 Admin socket disconnected: ${userId || "unknown"}`);
      } else if (role === "delivery") {
        console.log(`🔕 Delivery socket disconnected: ${userId || "unknown"}`);
      } else {
        console.log(`🔕 Customer socket disconnected: ${userId || "unknown"}`);
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}