import { RequestHandler, Router } from "express";
import extractJWT from "../auth/middleware";
import { UserRatingController } from "./controller";
import multer from 'multer';

const router = Router();

const storage = multer.diskStorage({
  destination: function (_req, _file, callback) {
      callback(null, 'data/userRatings/');
  },
  filename: function (_req, file, callback) {
      callback(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post("/parse", extractJWT, upload.single('file'), async (req, res) => {
  // eslint-disable-next-line
  const userId = res?.locals?.jwt?.userId;

  if (userId !== req.file?.originalname){
    return res.status(403).json({
      message: "Forbidden",
    });
  }
  
  await UserRatingController.parseUserRatings(userId, true);
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
