import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import { connectToMongo } from "./db";
import { Routes } from "./routes";

// initialize env configuration
dotenv.config();

const port: string = process.env.SERVER_PORT || "4000";
const secret: string = process.env.SECRET || "secretcode";
const app = express();

// middleware
app.use(express.json());
app.use(
  cors({
    origin: `http://localhost:${port}`,
    credentials: true,
  })
);
app.use(
  session({
    secret: secret,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(Routes);

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

connectToMongo();
