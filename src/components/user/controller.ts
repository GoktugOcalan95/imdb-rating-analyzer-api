import { IUserDoc, User } from "./model";
import { logger } from "../../utils";

export class UserController {
  public static async create(
    username: string,
    password: string
  ): Promise<IUserDoc | null> {
    const newUser = new User({ username, password });
    const createdUser = await User.create({
      username,
      password,
    }).catch((err) => {
      logError(err, newUser, "creating");
      return Promise.reject(null);
    });
    return Promise.resolve(createdUser);
  }

  public static async getByUsername(
    username: string
  ): Promise<IUserDoc | null> {
    return User.findOne({ username });
  }

  public static async getById(id: string): Promise<IUserDoc | null> {
    return User.findById(id).select("-password");
  }
}

function logError(err: any, user: IUserDoc, process: string) {
  if (err instanceof Error) {
    logger.error("Error %s user doc: %s", process, err.message);
  } else {
    logger.error("Error %s user doc: %o", process, err);
  }
  const userLeanObject = user.toObject();
  delete userLeanObject.password;
  logger.error("User: %o", userLeanObject);
}
