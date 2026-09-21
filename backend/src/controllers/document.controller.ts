import { Request, Response, NextFunction } from 'express';
import * as documentService from '../services/document.service';
import {
  PurchaseNotFoundError,
  SaleNotFoundError,
  BuyerPaymentNotFoundError,
} from '../services/document.service';

export const getFarmerPurchaseReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getFarmerPurchaseReceipt(
      req.params.purchaseId,
      req.user!.userId
    );
    res.status(200).json({ status: 'ok', data: document });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getFarmerPaymentReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getFarmerPaymentReceipt(
      req.params.purchaseId,
      req.user!.userId
    );
    res.status(200).json({ status: 'ok', data: document });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getBuyerSalesInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getBuyerSalesInvoice(
      req.params.saleId,
      req.user!.userId
    );
    res.status(200).json({ status: 'ok', data: document });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getBuyerPaymentReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getBuyerPaymentReceipt(
      req.params.buyerPaymentId,
      req.user!.userId
    );
    res.status(200).json({ status: 'ok', data: document });
  } catch (error) {
    if (error instanceof BuyerPaymentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
