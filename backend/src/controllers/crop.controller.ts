import { Request, Response, NextFunction } from 'express';
import * as cropService from '../services/crop.service';
import { DuplicateCropCodeError, CropNotFoundError } from '../services/crop.service';
import { ListCropsQuery } from '../validators/crop.validator';

export const getCrops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListCropsQuery;
    const result = await cropService.listCrops(query, req.user!.role);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getCrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop = await cropService.getCropById(req.params.id, req.user!.role);
    res.status(200).json({ status: 'ok', data: crop });
  } catch (error) {
    if (error instanceof CropNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postCrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop = await cropService.createCrop(req.body);
    res.status(201).json({ status: 'ok', data: crop });
  } catch (error) {
    if (error instanceof DuplicateCropCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putCrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop = await cropService.updateCrop(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: crop });
  } catch (error) {
    if (error instanceof CropNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateCropCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchCropStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crop = await cropService.updateCropStatus(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: crop });
  } catch (error) {
    if (error instanceof CropNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
