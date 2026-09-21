import { Request, Response, NextFunction } from 'express';
import * as qualityRecordService from '../services/qualityRecord.service';
import {
  PurchaseNotFoundError,
  BuyerNotFoundError,
  QualityStatusNotFoundError,
  RejectionReasonRequiredError,
  QualityRecordNotFoundError,
} from '../services/qualityRecord.service';
import { ListQualityRecordsQuery } from '../validators/qualityRecord.validator';

const REFERENCE_ERRORS = [PurchaseNotFoundError, BuyerNotFoundError, QualityStatusNotFoundError];

export const getQualityRecords = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListQualityRecordsQuery;
    const result = await qualityRecordService.listQualityRecords(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getQualityRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityRecordService.getQualityRecordById(req.params.id);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof QualityRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postQualityRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityRecordService.createQualityRecord(req.body, req.user!.userId);
    res.status(201).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof RejectionReasonRequiredError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (REFERENCE_ERRORS.some((ErrClass) => error instanceof ErrClass)) {
      return res.status(400).json({ status: 'error', message: (error as Error).message });
    }
    next(error);
  }
};

export const putQualityRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await qualityRecordService.updateQualityRecord(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof QualityRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof RejectionReasonRequiredError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (REFERENCE_ERRORS.some((ErrClass) => error instanceof ErrClass)) {
      return res.status(400).json({ status: 'error', message: (error as Error).message });
    }
    next(error);
  }
};
