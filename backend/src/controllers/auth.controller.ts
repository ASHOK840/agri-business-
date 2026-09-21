import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { InvalidCredentialsError, AccountDeactivatedError } from '../services/auth.service';

export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        status: 'error',
        message: error.message,
      });
    }
    if (error instanceof AccountDeactivatedError) {
      return res.status(403).json({
        status: 'error',
        message: error.message,
      });
    }
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user is guaranteed to exist here because this route is behind
    // the `authenticate` middleware.
    const user = await authService.getCurrentUser(req.user!.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.',
      });
    }

    res.status(200).json({ status: 'ok', data: user });
  } catch (error) {
    next(error);
  }
};

export const postLogout = (_req: Request, res: Response) => {
  // JWTs are stateless — there is nothing to invalidate server-side without
  // a token blacklist or refresh-token system (out of scope for now).
  // The frontend is responsible for discarding the token on logout.
  res.status(200).json({
    status: 'ok',
    message: 'Logged out. Please discard your token on the client.',
  });
};
