import { Request, Response, NextFunction } from 'express';
import * as staffPaymentService from '../services/staffPayment.service';
import {
  AssignmentNotFoundError,
  StaffPaymentNotFoundError,
  PaymentExceedsOutstandingError,
} from '../services/staffPayment.service';
import { ListStaffPaymentsQuery } from '../validators/staffPayment.validator';
import { buildAuditContext } from '../services/audit.service';
import { DuplicateSubmissionError } from '../utils/duplicateGuard';

export const getStaffPayments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListStaffPaymentsQuery;
    const result = await staffPaymentService.listStaffPayments(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getStaffPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await staffPaymentService.getStaffPaymentById(req.params.id);
    res.status(200).json({ status: 'ok', data: payment });
  } catch (error) {
    if (error instanceof StaffPaymentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getAssignmentPaymentSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await staffPaymentService.getAssignmentPaymentSummary(req.params.assignmentId);
    res.status(200).json({ status: 'ok', data: summary });
  } catch (error) {
    if (error instanceof AssignmentNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postStaffPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await staffPaymentService.createStaffPayment(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: payment });
  } catch (error) {
    if (error instanceof AssignmentNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof PaymentExceedsOutstandingError || error instanceof DuplicateSubmissionError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
