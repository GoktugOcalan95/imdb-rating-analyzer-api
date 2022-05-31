import { RequestHandler, Router } from "express";
import extractJWT from "../auth/middleware";
import { UserRatingController } from "./controller";

const router = Router();

router.get("/parse", extractJWT, (_req, res) => {
  // eslint-disable-next-line
  void UserRatingController.parseUserRatings(res?.locals?.jwt?.userId);
  res.sendStatus(200);
});

// GET Rating By Query
router.get("/", extractJWT, (async (req, res) => {
  // eslint-disable-next-line
  await UserRatingController.getByUserId(res?.locals?.jwt?.userId, req.query)
    .then(titles => res.send(titles))
    .catch(() => {
      return res.status(500).json({
        message: "An unexpected error occured",
      });
    });
}) as RequestHandler);

export const userRatingRoutes = router;
export default userRatingRoutes;
