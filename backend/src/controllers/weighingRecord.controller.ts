import { Request, Response, NextFunction } from 'express';
import * as weighingService from '../services/weighingRecord.service';
import {
  PurchaseNotFoundError,
  WeighingRecordNotFoundError,
} from '../services/weighingRecord.service';
import { ListWeighingRecordsQuery } from '../validators/weighingRecord.validator';

export const getWeighingRecords = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListWeighingRecordsQuery;
    const result = await weighingService.listWeighingRecords(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getWeighingRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await weighingService.getWeighingRecordById(req.params.id);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof WeighingRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postWeighingRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await weighingService.createWeighingRecord(req.body, req.user!.userId);
    res.status(201).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof PurchaseNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
