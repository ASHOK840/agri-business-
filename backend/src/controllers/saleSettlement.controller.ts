import { Request, Response, NextFunction } from 'express';
import * as saleSettlementService from '../services/saleSettlement.service';
import {
  SaleNotFoundError,
  SaleSettlementNotFoundError,
  SaleNotDispatchedError,
  SettlementAlreadyExistsError,
  SettlementRequiresOwnerError,
  QuantityAffectedExceedsDispatchError,
} from '../services/saleSettlement.service';
import { ListSaleSettlementsQuery } from '../validators/saleSettlement.validator';
import { buildAuditContext } from '../services/audit.service';

export const getSaleSettlements = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListSaleSettlementsQuery;
    const result = await saleSettlementService.listSaleSettlements(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSaleSettlement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlement = await saleSettlementService.getSaleSettlementById(req.params.id);
    res.status(200).json({ status: 'ok', data: settlement });
  } catch (error) {
    if (error instanceof SaleSettlementNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getSaleSettlementForSale = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const settlement = await saleSettlementService.getSaleSettlementBySaleId(req.params.saleId);
    res.status(200).json({ status: 'ok', data: settlement });
  } catch (error) {
    if (error instanceof SaleSettlementNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postSaleSettlement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlement = await saleSettlementService.createSaleSettlement(
      req.body,
      req.user!.userId,
      req.user!.role,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: settlement });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof QuantityAffectedExceedsDispatchError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof SettlementRequiresOwnerError) {
      return res.status(403).json({ status: 'error', message: error.message });
    }
    if (error instanceof SaleNotDispatchedError || error instanceof SettlementAlreadyExistsError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
