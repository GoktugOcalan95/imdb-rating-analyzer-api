import jwt from "jsonwebtoken";
import { SecurityConfig } from "../../config";
import { Request, Response, NextFunction } from "express";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const extractJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    jwt.verify(token, SecurityConfig.secret, (err, decoded) => {
      if (err) {
        return res.status(404).json({
          message: err,
          err,
        });
      } else {
        res.locals.jwt = decoded;
        next();
      }
    });
  } else {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export default extractJWT;
