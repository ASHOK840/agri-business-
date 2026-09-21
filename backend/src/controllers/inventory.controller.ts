import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventory.service';
import {
  WarehouseNotFoundError,
  CropNotFoundError,
  InsufficientStockError,
  MovementNotFoundError,
} from '../services/inventory.service';
import { ListMovementsQuery, StockQuery } from '../validators/inventory.validator';
import { buildAuditContext } from '../services/audit.service';

export const getStock = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as StockQuery;
    const stock = await inventoryService.getCurrentStock(query);
    res.status(200).json({ status: 'ok', data: stock });
  } catch (error) {
    if (error instanceof WarehouseNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getMovements = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListMovementsQuery;
    const result = await inventoryService.listMovements(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movement = await inventoryService.getMovementById(req.params.id);
    res.status(200).json({ status: 'ok', data: movement });
  } catch (error) {
    if (error instanceof MovementNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postDispatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movement = await inventoryService.createDispatch(req.body, req.user!.userId);
    res.status(201).json({ status: 'ok', data: movement });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    if (error instanceof CropNotFoundError || error instanceof WarehouseNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postAdjustment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movement = await inventoryService.createAdjustment(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: movement });
  } catch (error) {
    if (error instanceof CropNotFoundError || error instanceof WarehouseNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
