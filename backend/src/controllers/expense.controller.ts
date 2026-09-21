import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service';
import {
  ExpenseCategoryNotFoundError,
  PurchaseNotFoundError,
  SaleNotFoundError,
  ExpenseNotFoundError,
  ExpenseAlreadyCancelledError,
  ConflictingRelatedRecordsError,
} from '../services/expense.service';
import { ListExpensesQuery, ExpenseSummaryQuery } from '../validators/expense.validator';
import { buildAuditContext } from '../services/audit.service';
import { DuplicateSubmissionError } from '../utils/duplicateGuard';

export const getExpenses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListExpensesQuery;
    const result = await expenseService.listExpenses(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getExpenseSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ExpenseSummaryQuery;
    const summary = await expenseService.getExpenseSummary(query);
    res.status(200).json({ status: 'ok', data: summary });
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    res.status(200).json({ status: 'ok', data: expense });
  } catch (error) {
    if (error instanceof ExpenseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

const handleRelatedRecordErrors = (error: unknown, res: Response, next: NextFunction) => {
  if (
    error instanceof ExpenseCategoryNotFoundError ||
    error instanceof PurchaseNotFoundError ||
    error instanceof SaleNotFoundError
  ) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
  if (error instanceof ConflictingRelatedRecordsError) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
  next(error);
};

export const postExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.createExpense(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: expense });
  } catch (error) {
    if (error instanceof DuplicateSubmissionError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    handleRelatedRecordErrors(error, res, next);
  }
};

export const putExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: expense });
  } catch (error) {
    if (error instanceof ExpenseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof ExpenseAlreadyCancelledError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    handleRelatedRecordErrors(error, res, next);
  }
};

export const patchExpenseCancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.cancelExpense(
      req.params.id,
      req.body,
      req.user!.userId
    );
    res.status(200).json({ status: 'ok', data: expense });
  } catch (error) {
    if (error instanceof ExpenseNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof ExpenseAlreadyCancelledError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
