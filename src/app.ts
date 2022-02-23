import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectToMongo } from "./db";
import { Routes } from "./routes";
import { AppConfig } from "./config";
import { logger } from "./utils";
import cookieParser from "cookie-parser";

// initialize env configuration
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: `http://${AppConfig.hostname}:${AppConfig.port}`,
  })
);
app.use(Routes);

// start the Express server
app.listen(AppConfig.port, () => {
  logger.info(`server started at http://${AppConfig.hostname}:${AppConfig.port}`);
});

connectToMongo();
