import { Request, Response, NextFunction } from 'express';
import * as buyerPaymentService from '../services/buyerPayment.service';
import {
  SaleNotFoundError,
  BuyerPaymentNotFoundError,
  SettlementRequiredError,
  PaymentExceedsOutstandingError,
} from '../services/buyerPayment.service';
import { ListBuyerPaymentsQuery } from '../validators/buyerPayment.validator';
import { buildAuditContext } from '../services/audit.service';
import { DuplicateSubmissionError } from '../utils/duplicateGuard';

export const getBuyerPayments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListBuyerPaymentsQuery;
    const result = await buyerPaymentService.listBuyerPayments(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getBuyerPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await buyerPaymentService.getBuyerPaymentById(req.params.id);
    res.status(200).json({ status: 'ok', data: payment });
  } catch (error) {
    if (error instanceof BuyerPaymentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getSalePaymentSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await buyerPaymentService.getSalePaymentSummary(req.params.saleId);
    res.status(200).json({ status: 'ok', data: summary });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postBuyerPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await buyerPaymentService.createBuyerPayment(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: payment });
  } catch (error) {
    if (error instanceof SaleNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (
      error instanceof SettlementRequiredError ||
      error instanceof PaymentExceedsOutstandingError ||
      error instanceof DuplicateSubmissionError
    ) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
