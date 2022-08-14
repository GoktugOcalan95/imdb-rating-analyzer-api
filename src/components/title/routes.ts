import { RequestHandler, Router } from "express";
import { TitleController } from "./controller";
import extractJWT from "../auth/middleware";

const router = Router();

// GET Title by Imdb Id
router.get("/:imdbId", extractJWT, (async (req, res) => {
  const title = await TitleController.getByImdbId(req.params.imdbId);
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

// GET Title By Name Matching
router.get("/search/:name", extractJWT, (async (req, res) => {
  const titles = await TitleController.searchByName(req.params.name);
  if (!titles) {
    return res.status(404).json({
      message: "Results not found",
    });
  }
  res.send(titles);
}) as RequestHandler);

// GET Series By Name Matching
router.get("/search/series/:name", extractJWT, (async (req, res) => {
  const titles = await TitleController.searchByName(req.params.name, ['tvSeries', 'tvMiniSeries']);
  if (!titles) {
    return res.status(404).json({
      message: "Results not found",
    });
  }
  res.send(titles);
}) as RequestHandler);

// GET Episodes By Parent Title, With User Ratings
router.get("/episodes/:imdbId", extractJWT, (async (req, res) => {
  // eslint-disable-next-line
  await TitleController.getEpisodesWithUserRating(req.params.imdbId, res?.locals?.jwt?.userId)
    .then(title => res.send(title))
    .catch(() => {
      return res.status(500).json({
        message: "An unexpected error occured",
      });
    });
}) as RequestHandler);

export const titleRoutes = router;
export default titleRoutes;
