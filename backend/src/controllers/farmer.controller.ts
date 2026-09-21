import { Request, Response, NextFunction } from 'express';
import * as farmerService from '../services/farmer.service';
import {
  DuplicateFarmerCodeError,
  PossibleDuplicateFarmerError,
  FarmerNotFoundError,
} from '../services/farmer.service';
import { ListFarmersQuery } from '../validators/farmer.validator';
import { buildAuditContext } from '../services/audit.service';

export const getFarmers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListFarmersQuery;
    const result = await farmerService.listFarmers(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.getFarmerById(req.params.id);
    res.status(200).json({ status: 'ok', data: farmer });
  } catch (error) {
    if (error instanceof FarmerNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.createFarmer(req.body, buildAuditContext(req));
    res.status(201).json({ status: 'ok', data: farmer });
  } catch (error) {
    if (error instanceof DuplicateFarmerCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    if (error instanceof PossibleDuplicateFarmerError) {
      // 409 with the existing record attached, so the frontend can show
      // "did you mean this farmer?" and offer a force-create option.
      return res.status(409).json({
        status: 'error',
        message: error.message,
        code: 'POSSIBLE_DUPLICATE',
        existingFarmer: error.existingFarmer,
      });
    }
    next(error);
  }
};

export const putFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.updateFarmer(req.params.id, req.body, buildAuditContext(req));
    res.status(200).json({ status: 'ok', data: farmer });
  } catch (error) {
    if (error instanceof FarmerNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateFarmerCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchFarmerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.updateFarmerStatus(
      req.params.id,
      req.body,
      buildAuditContext(req)
    );
    res.status(200).json({ status: 'ok', data: farmer });
  } catch (error) {
    if (error instanceof FarmerNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
