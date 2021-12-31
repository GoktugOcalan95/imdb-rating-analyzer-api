import { Request, RequestHandler, Router } from "express";
import bcrypt from "bcryptjs";
import { UserController } from "./controller";
import extractJWT from "../auth/middleware";
import { AuthController } from "../auth/controller";

const router = Router();

type ReqParams = {
  username: string;
  password: string;
};

// CREATE USER
router.post("/", (async (
  req: Request<unknown, unknown, ReqParams, unknown>,
  res
) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const createdUser = (
    await UserController.create(req.body.username, hashedPassword).catch(() => {
      res.status(404).send("Error creating user");
    })
  )?.toObject();

  delete createdUser?.password;
  res.send(createdUser);
}) as RequestHandler);

// LOGIN USER
router.post("/login", (async (
  req: Request<unknown, unknown, ReqParams, unknown>,
  res
) => {
  const { username, password } = req?.body;
  await UserController.getByUsername(username).then((user) => {
    if (!user || !user.password) {
      return res.status(401).json({
        message: "Wrong Username or Password",
      });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
          error: err,
        });
      } else if (!result) {
        return res.status(401).json({
          message: "Wrong Username or Password",
        });
      }
      AuthController.signJWT(user, (_err, token) => {
        if (_err) {
          return res.status(500).json({
            message: _err.message,
            error: _err,
          });
        } else if (token) {
          return res.status(200).json({
            token: token,
          });
        }
      });
    });
  });
}) as RequestHandler);

// GET USER
router.get("/:userId", extractJWT, (async (req, res) => {
  const user = await UserController.getById(req.params.userId);
  res.send(user);
}) as RequestHandler);

export const userRoutes = router;
export default userRoutes;
