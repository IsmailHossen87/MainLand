
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

const createToken = (
  payload: object,
  secret: Secret,
  expireTime?: string | number
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: (expireTime || '1d') as any
  });
};

const refreshToken = (
  payload: object,
  secret: Secret,
  expireTime?: string | number
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: (expireTime || '7d') as any
  });
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelper = { createToken, refreshToken, verifyToken };