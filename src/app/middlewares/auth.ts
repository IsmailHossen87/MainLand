import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../errors/AppError';
import { jwtHelper } from '../../helpers/jwtHelper';

const auth =
  (...roles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tokenWithBearer = req.headers.authorization;

        // Check if token exists
        if (!tokenWithBearer) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
        }

        // Check if token starts with Bearer
        if (!tokenWithBearer.startsWith('Bearer ')) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token format');
        }

        // Extract token
        const token = tokenWithBearer.split(' ')[1];

        // Verify token
        const verifyUser = jwtHelper.verifyToken(
          token,
          config.jwt.jwt_secret as Secret
        ) as JwtPayload;

        // ✅ FIX: Set user to request object
        req.user = {
          id: verifyUser.id,
          role: verifyUser.role,
          email: verifyUser.email,
        };

        console.log('Authenticated user:', req.user);

        // Guard user - check role authorization
        if (roles.length && !roles.includes(verifyUser.role)) {
          throw new AppError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this api"
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };

export default auth;