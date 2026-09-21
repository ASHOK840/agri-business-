import { Request, Response, NextFunction } from 'express';
import * as purchaseService from '../services/purchase.service';
import {
  FarmerNotFoundError,
  CropNotFoundError,
  PurchaseNotFoundError,
  TerminalStatusError,
  NotWeighedError,
} from '../services/purchase.service';
import { ListPurchasesQuery } from '../validators/purchase.validator';
import { buildAuditContext } from '../services/audit.service';
import { DuplicateSubmissionError } from '../utils/duplicateGuard';

export const getPurchases = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListPurchasesQuery;
    const result = await purchaseService.listPurchases(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id);
    res.status(200).json({ status: 'ok', data: purchase });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.createPurchase(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: purchase });
  } catch (error) {
    if (error instanceof FarmerNotFoundError || error instanceof CropNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateSubmissionError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.updatePurchase(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: purchase });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof TerminalStatusError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchPurchaseStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.updatePurchaseStatus(
      req.params.id,
      req.body,
      buildAuditContext(req)
    );
    res.status(200).json({ status: 'ok', data: purchase });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof TerminalStatusError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    if (error instanceof NotWeighedError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
