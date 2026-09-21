import { Request, Response, NextFunction } from 'express';
import * as qualityStatusService from '../services/qualityStatus.service';
import {
  DuplicateQualityCodeError,
  QualityStatusNotFoundError,
} from '../services/qualityStatus.service';
import { ListQualityStatusesQuery } from '../validators/qualityStatus.validator';

export const getQualityStatuses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListQualityStatusesQuery;
    const result = await qualityStatusService.listQualityStatuses(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getQualityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityStatusService.getQualityStatusById(req.params.id);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof QualityStatusNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postQualityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityStatusService.createQualityStatus(req.body);
    res.status(201).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof DuplicateQualityCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putQualityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityStatusService.updateQualityStatus(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof QualityStatusNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateQualityCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchQualityStatusStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityStatusService.updateQualityStatusStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof QualityStatusNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
