import { Request, Response, NextFunction } from 'express';
import * as profitLossService from '../services/profitLoss.service';
import { SaleNotFoundError, SettlementRequiredError } from '../services/profitLoss.service';

export const getSaleProfitLoss = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profitLossService.getSaleProfitLoss(req.params.saleId);
    res.status(200).json({ status: 'ok', data: result });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof SettlementRequiredError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
