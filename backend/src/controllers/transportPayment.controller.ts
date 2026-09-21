import { Request, Response, NextFunction } from 'express';
import * as transportPaymentService from '../services/transportPayment.service';
import {
  TransportRecordNotFoundError,
  TransportPaymentNotFoundError,
  PaymentExceedsOutstandingError,
} from '../services/transportPayment.service';
import { ListTransportPaymentsQuery } from '../validators/transportPayment.validator';
import { buildAuditContext } from '../services/audit.service';
import { DuplicateSubmissionError } from '../utils/duplicateGuard';

export const getTransportPayments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListTransportPaymentsQuery;
    const result = await transportPaymentService.listTransportPayments(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getTransportPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await transportPaymentService.getTransportPaymentById(req.params.id);
    res.status(200).json({ status: 'ok', data: payment });
  } catch (error) {
    if (error instanceof TransportPaymentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getTransportRecordPaymentSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await transportPaymentService.getTransportRecordPaymentSummary(
      req.params.transportRecordId
    );
    res.status(200).json({ status: 'ok', data: summary });
  } catch (error) {
    if (error instanceof TransportRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postTransportPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await transportPaymentService.createTransportPayment(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: payment });
  } catch (error) {
    if (error instanceof TransportRecordNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof PaymentExceedsOutstandingError || error instanceof DuplicateSubmissionError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
