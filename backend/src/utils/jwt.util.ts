import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: 'ADMIN' | 'STAFF' | 'TRANSPORTATION';
}

// Algorithm pinned explicitly on both sign and verify. Omitting
// `algorithms` on verify() would accept any algorithm the token claims
// to use, which is how "algorithm confusion" attacks forge tokens —
// pinning to HS256 closes that off.
const JWT_ALGORITHM = 'HS256' as const;

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: JWT_ALGORITHM,
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret, { algorithms: [JWT_ALGORITHM] }) as JwtPayload;
};
