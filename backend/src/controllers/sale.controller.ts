import { Request, Response, NextFunction } from 'express';
import * as saleService from '../services/sale.service';
import {
  BuyerNotFoundError,
  CropNotFoundError,
  WarehouseNotFoundError,
  SaleNotFoundError,
  InsufficientStockError,
  TerminalStatusError,
  RequiresSettlementError,
} from '../services/sale.service';
import { ListSalesQuery } from '../validators/sale.validator';
import { buildAuditContext } from '../services/audit.service';
import { DuplicateSubmissionError } from '../utils/duplicateGuard';

export const getSales = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListSalesQuery;
    const result = await saleService.listSales(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    res.status(200).json({ status: 'ok', data: sale });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await saleService.createSale(req.body, req.user!.userId, buildAuditContext(req));
    res.status(201).json({ status: 'ok', data: sale });
  } catch (error) {
    if (
      error instanceof BuyerNotFoundError ||
      error instanceof CropNotFoundError ||
      error instanceof WarehouseNotFoundError
    ) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof InsufficientStockError || error instanceof DuplicateSubmissionError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchSaleStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await saleService.updateSaleStatus(req.params.id, req.body, req.user!.userId);
    res.status(200).json({ status: 'ok', data: sale });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (
      error instanceof TerminalStatusError ||
      error instanceof InsufficientStockError ||
      error instanceof RequiresSettlementError
    ) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
