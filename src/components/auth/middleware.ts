import jwt from "jsonwebtoken";
import { SecurityConfig } from "../../config";
import { Request, Response, NextFunction } from "express";

// eslint-disable-next-line
export const extractJWT = (req: Request, res: Response, next: NextFunction) => {
  // eslint-disable-next-line
  const cookie = req.cookies["jwt"];
  const token = cookie ? String(cookie) : undefined;

  if (token) {
    jwt.verify(token, SecurityConfig.secret, (err, decoded) => {
      if (err) {
        return res.status(404).json({
          message: err,
          err,
        });
      } else {
        if (decoded && !decoded.userId) {
          return res.status(400).json({
            message: "Invalid token",
          });
        }
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
