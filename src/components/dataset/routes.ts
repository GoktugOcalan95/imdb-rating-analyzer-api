import { Router } from "express";
import { DatasetController } from "./controller";

const router = Router();

router.get("/updateAll", (_req, res) => {
  void DatasetController.updateAll();
  res.sendStatus(200);
});

export const datasetRoutes = router;
export default datasetRoutes;
