import { Request, Response, NextFunction } from 'express';
import * as buyerService from '../services/buyer.service';
import { DuplicateBuyerCodeError, BuyerNotFoundError } from '../services/buyer.service';
import { ListBuyersQuery } from '../validators/buyer.validator';
import { buildAuditContext } from '../services/audit.service';

export const getBuyers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListBuyersQuery;
    const result = await buyerService.listBuyers(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getBuyer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyer = await buyerService.getBuyerById(req.params.id);
    res.status(200).json({ status: 'ok', data: buyer });
  } catch (error) {
    if (error instanceof BuyerNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postBuyer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyer = await buyerService.createBuyer(req.body, buildAuditContext(req));
    res.status(201).json({ status: 'ok', data: buyer });
  } catch (error) {
    if (error instanceof DuplicateBuyerCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putBuyer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyer = await buyerService.updateBuyer(req.params.id, req.body, buildAuditContext(req));
    res.status(200).json({ status: 'ok', data: buyer });
  } catch (error) {
    if (error instanceof BuyerNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateBuyerCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchBuyerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyer = await buyerService.updateBuyerStatus(
      req.params.id,
      req.body,
      buildAuditContext(req)
    );
    res.status(200).json({ status: 'ok', data: buyer });
  } catch (error) {
    if (error instanceof BuyerNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
