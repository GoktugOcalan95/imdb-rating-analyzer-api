import { RequestHandler, Router } from "express";
import extractJWT from "../auth/middleware";
import { UserRatingController } from "./controller";

const router = Router();

router.get("/parse", extractJWT, (_req, res) => {

  // eslint-disable-next-line
  if (!res?.locals?.jwt?.userId) {
    return res.status(400).json({
      message: "Invalid token",
    });
  }

  // eslint-disable-next-line
  void UserRatingController.parseUserRatings(res.locals.jwt.userId);
  res.sendStatus(200);
});

// GET Rating By Query
router.get("/", extractJWT, (async (req, res) => {

  // eslint-disable-next-line
  if (!res?.locals?.jwt?.userId) {
    return res.status(400).json({
      message: "Invalid token",
    });
  }

  // eslint-disable-next-line
  const titles = await UserRatingController.getByUserId(res.locals.jwt.userId, req.query);
  if (!titles) {
    return res.status(404).json({
      message: "Results not found",
    });
  }
  res.send(titles);
}) as RequestHandler);

export const userRatingRoutes = router;
export default userRatingRoutes;
