import { Router } from "express";
import datasetRoutes from "./components/dataset/routes";
import userRoutes from "./components/user/routes";
import userRatingRoutes from "./components/userRating/routes";

const router: Router = Router();
router.use("/dataset", datasetRoutes);
router.use("/user", userRoutes);
router.use("/userRating", userRatingRoutes);

export const Routes = router;
