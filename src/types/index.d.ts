import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User {
      id: string;
    }

    interface Request {
      user?: JwtPayload;
    }
  }
}
