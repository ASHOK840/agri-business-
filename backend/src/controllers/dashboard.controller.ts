import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await dashboardService.getDashboard();
    res.status(200).json({ status: 'ok', data: dashboard });
  } catch (error) {
    next(error);
  }
};
