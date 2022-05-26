import { Router } from "express";
import datasetRoutes from "./components/dataset/routes";
import titleRoutes from "./components/title/routes";
import userRoutes from "./components/user/routes";
import userRatingRoutes from "./components/userRating/routes";

const router: Router = Router();
router.use("/dataset", datasetRoutes);
router.use("/title", titleRoutes);
router.use("/user", userRoutes);
router.use("/rating", userRatingRoutes);

export const Routes = router;
