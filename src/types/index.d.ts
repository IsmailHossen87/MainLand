import { JwtPayload } from 'jsonwebtoken';

export interface IJwtUser {
  id: string;
  role: string;
  email: string;
}

declare global {
  namespace Express {
    interface User extends IJwtUser { }

    interface Request {
      user?: IJwtUser;
    }
  }
}