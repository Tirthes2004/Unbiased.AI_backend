import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import uploadRoutes from "./routes/upload.routes.js";
import { env } from "./config/env.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(apiLimiter);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      environment: env.nodeEnv,
    },
  });
});

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.use("/api/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
