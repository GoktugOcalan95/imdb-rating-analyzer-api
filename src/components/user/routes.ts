import { Request, RequestHandler, Router } from "express";
import bcrypt from "bcryptjs";
import { UserController } from "./controller";

const router = Router();

type ReqParams = {
  username: string;
  password: string;
};

router.post("/", (async (
  req: Request<unknown, unknown, ReqParams, unknown>,
  res
) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const createdUser = (
    await UserController.create(req.body.username, hashedPassword).catch(() => {
      res.status(400).send("Error creating user");
    })
  )?.toObject();

  delete createdUser?.password;
  res.send(createdUser);
}) as RequestHandler);

router.get("/:userId", (async (req, res) => {
  const user = await UserController.getById(req.params.userId);
  res.send(user);
}) as RequestHandler);

export const userRoutes = router;
export default userRoutes;
