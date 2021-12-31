import { Router } from "express";
import { UserRatingController } from "./controller";

const router = Router();

router.get("/:userId/parse", (req, res) => {
  void UserRatingController.parseUserRatings(req.params.userId);
  res.sendStatus(200);
});

export const userRatingRoutes = router;
export default userRatingRoutes;
