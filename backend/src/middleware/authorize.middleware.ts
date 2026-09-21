import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt.util';

// Must run AFTER `authenticate` middleware, since it relies on req.user
// already being set from a verified JWT.
export const authorize = (...allowedRoles: JwtPayload['role'][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};
