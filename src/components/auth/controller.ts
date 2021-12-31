import jwt from "jsonwebtoken";
import { logger } from "../../utils";
import { SecurityConfig } from "../../config";
import { IUserDoc } from "../user/model";

export class AuthController {
  public static signJWT(
    user: IUserDoc,
    callback: (error: Error | null, token: string | null) => void
  ): void {
    jwt.sign(
      {
        username: user.username,
      },
      SecurityConfig.secret,
      {
        issuer: SecurityConfig.issuer,
        algorithm: "HS256",
        expiresIn: SecurityConfig.tokenExpireTime,
      },
      (err, token) => {
        if (err) {
          logError(err, "signJWT");
          callback(err, null);
        } else if (token) {
          callback(null, token);
        }
      }
    );
  }
}

function logError(err: any, func: string) {
  if (err instanceof Error) {
    logger.error("Error in %s: %s", func, err.message);
  } else {
    logger.error("Error in %s: %o", func, err);
  }
}
