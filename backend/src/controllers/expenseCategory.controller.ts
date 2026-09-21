import { Request, Response, NextFunction } from 'express';
import * as expenseCategoryService from '../services/expenseCategory.service';
import {
  DuplicateExpenseCategoryCodeError,
  ExpenseCategoryNotFoundError,
} from '../services/expenseCategory.service';
import { ListExpenseCategoriesQuery } from '../validators/expenseCategory.validator';

export const getExpenseCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListExpenseCategoriesQuery;
    const result = await expenseCategoryService.listExpenseCategories(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getExpenseCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await expenseCategoryService.getExpenseCategoryById(req.params.id);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof ExpenseCategoryNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postExpenseCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await expenseCategoryService.createExpenseCategory(req.body);
    res.status(201).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof DuplicateExpenseCategoryCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putExpenseCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await expenseCategoryService.updateExpenseCategory(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof ExpenseCategoryNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateExpenseCategoryCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchExpenseCategoryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const record = await expenseCategoryService.updateExpenseCategoryStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof ExpenseCategoryNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
