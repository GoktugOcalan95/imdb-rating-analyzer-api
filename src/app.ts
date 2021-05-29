import dotenv from "dotenv";
import express from "express";
import { connectToMongo } from "./db";

// initialize env configuration
dotenv.config();

const port: string = process.env.SERVER_PORT || "4000";
const app = express();

// define a route handler for the default home page
app.get("/", (req, res) => {
  res.send("Hello world!");
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

connectToMongo();
