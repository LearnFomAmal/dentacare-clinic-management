import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import router from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import AppError from "./shared/errors/AppError.js";
import { env } from "./config/env.js";

const app = express();

app.set("trust proxy", 1);

app.get("/", (req, res) => {
  res.send("DentaCare Backend Running");
});

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use("/api/v1", router);

app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;