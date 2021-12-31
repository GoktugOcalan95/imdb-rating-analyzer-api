import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectToMongo } from "./db";
import { Routes } from "./routes";
import { AppConfig } from "./config";

// initialize env configuration
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(
  cors({
    origin: `http://${AppConfig.hostname}:${AppConfig.port}`,
    credentials: true,
  })
);
app.use(Routes);

// start the Express server
app.listen(AppConfig.port, () => {
  console.log(
    `server started at http://${AppConfig.hostname}:${AppConfig.port}`
  );
});

connectToMongo();
