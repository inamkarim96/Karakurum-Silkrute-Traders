const { Server } = require("socket.io");
const { FRONTEND_URL } = require("../config/env");

let io;

const init = (server) => {
  const cleanFrontendUrl = FRONTEND_URL ? FRONTEND_URL.replace(/\/$/, "") : "";
  
  const allowedOrigins = [
    cleanFrontendUrl,
    cleanFrontendUrl.toLowerCase(),
    "http://localhost:5000"
  ];
  
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:5173", "http://localhost:5174", "http://localhost:5175");
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const norm = origin.replace(/\/+$/, "").toLowerCase();
        if (allowedOrigins.some(o => o.toLowerCase() === norm)) {
          return callback(null, true);
        }
        try {
          const host = new URL(origin).hostname;
          if (host.endsWith(".vercel.app")) {
            return callback(null, true);
          }
        } catch (_) {}
        return callback(null, true);
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client should emit 'join' with their role/ID
    socket.on("join", (data) => {
      if (data?.role === "admin") {
        socket.join("admin");
        console.log(`Socket ${socket.id} joined admin room`);
      }
      if (data?.userId) {
        socket.join(`user_${data.userId}`);
        console.log(`Socket ${socket.id} joined user_${data.userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  init,
  getIO,
};
