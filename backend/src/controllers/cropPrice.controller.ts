import { Request, Response, NextFunction } from 'express';
import * as cropPriceService from '../services/cropPrice.service';
import {
  CropNotFoundError,
  BuyerNotFoundError,
  CropPriceNotFoundError,
} from '../services/cropPrice.service';
import { ListCropPricesQuery, LatestCropPriceQuery } from '../validators/cropPrice.validator';
import { buildAuditContext } from '../services/audit.service';

export const getCropPrices = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListCropPricesQuery;
    const result = await cropPriceService.listCropPrices(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getLatestCropPrices = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as LatestCropPriceQuery;
    const prices = await cropPriceService.getLatestCropPrices(query);
    res.status(200).json({ status: 'ok', data: prices });
  } catch (error) {
    next(error);
  }
};

export const getCropPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const price = await cropPriceService.getCropPriceById(req.params.id);
    res.status(200).json({ status: 'ok', data: price });
  } catch (error) {
    if (error instanceof CropPriceNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postCropPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const price = await cropPriceService.createCropPrice(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: price });
  } catch (error) {
    if (error instanceof CropNotFoundError || error instanceof BuyerNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
