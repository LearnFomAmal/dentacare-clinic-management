import http from "http";

import app from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./socket/socket.js";

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.log("Server startup failed:", error.message);
  }
};

startServer();