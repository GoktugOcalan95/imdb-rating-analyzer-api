import { Request, RequestHandler, Router } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { UserController } from "./controller";
import extractJWT from "../auth/middleware";
import { AuthController } from "../auth/controller";
import { SecurityConfig } from "../../config";

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
        message: "Wrong username or password",
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
          message: "Wrong username or password",
        });
      }
      AuthController.signJWT(user, (_err, token) => {
        if (_err) {
          return res.status(500).json({
            message: _err.message,
            error: _err,
          });
        } else if (token) {
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: Number(SecurityConfig.tokenExpireTime) * 1000,
          });
          const userWithoutPassword = user.toObject();
          delete userWithoutPassword.password;
          return res.status(200).json(userWithoutPassword);
        }
      });
    });
  });
}) as RequestHandler);

// GET USER BY TOKEN
router.get("/", extractJWT, (async (_req, res) => {
  // eslint-disable-next-line
  if (!res?.locals?.jwt?.username) {
    return res.status(400).json({
      message: "Invalid token",
    });
  }

  // eslint-disable-next-line
  const user = await UserController.getByUsername(res.locals.jwt.username);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  res.send(user);
}) as RequestHandler);

// GET USER BY ID
router.get("/:userId", extractJWT, (async (req, res) => {
  // eslint-disable-next-line
  if (!res?.locals?.jwt?.isAdmin) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({
      message: "Invalid userId",
    });
  }

  const user = await UserController.getById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  res.send(user);
}) as RequestHandler);

router.post("/logout", (_req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.sendStatus(200);
});

export const userRoutes = router;
export default userRoutes;
