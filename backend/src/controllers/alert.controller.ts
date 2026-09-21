import { Request, Response, NextFunction } from 'express';
import * as alertService from '../services/alert.service';

export const getBusinessAlerts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await alertService.getAlerts();
    res.status(200).json({ status: 'ok', data: alerts });
  } catch (error) {
    next(error);
  }
};
