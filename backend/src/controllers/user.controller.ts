import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { DuplicateEmailError, UserNotFoundError, CannotModifyAdminError } from '../services/user.service';
import { ListUsersQuery } from '../validators/user.validator';

export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListUsersQuery;
    const users = await userService.listUsers(query);
    res.status(200).json({ status: 'ok', data: users });
  } catch (error) {
    next(error);
  }
};

export const postUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ status: 'ok', data: user });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.isActive);
    res.status(200).json({ status: 'ok', data: user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof CannotModifyAdminError) {
      return res.status(403).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.resetUserPassword(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof CannotModifyAdminError) {
      return res.status(403).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
