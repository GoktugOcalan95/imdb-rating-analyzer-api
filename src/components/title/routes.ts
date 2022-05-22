import { RequestHandler, Router } from "express";
import mongoose from "mongoose";
import { TitleController } from "./controller";
import extractJWT from "../auth/middleware";

const router = Router();

// GET Title BY IMDB ID
router.get("/:id", extractJWT, (async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({
      message: "Invalid titleId",
    });
  }

  const title = await TitleController.getByImdbId(req.params.id);
  if (!title) {
    return res.status(404).json({
      message: "Title not found",
    });
  }
  res.send(title);
}) as RequestHandler);

// GET Title By Query
router.get("/", extractJWT, (async (req, res) => {
  const titles = await TitleController.getAll(req.query);
  if (!titles) {
    return res.status(404).json({
      message: "Results not found",
    });
  }
  res.send(titles);
}) as RequestHandler);

export const titleRoutes = router;
export default titleRoutes;
