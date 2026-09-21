import { Request, Response, NextFunction } from 'express';
import * as staffEntryService from '../services/staffEntry.service';
import { CropNotFoundError, CropRateNotSetError } from '../services/staffEntry.service';
import { FarmerNotFoundError } from '../services/purchase.service';
import { buildAuditContext } from '../services/audit.service';
import { ListMyStaffEntriesQuery } from '../validators/staffEntry.validator';

export const postStaffEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await staffEntryService.createStaffEntry(
      req.body,
      req.user!.userId,
      buildAuditContext(req)
    );
    res.status(201).json({ status: 'ok', data: entry });
  } catch (error) {
    if (error instanceof CropNotFoundError || error instanceof FarmerNotFoundError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    if (error instanceof CropRateNotSetError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const getMyStaffEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListMyStaffEntriesQuery;
    const entries = await staffEntryService.listMyStaffEntries(req.user!.userId, query.limit);
    res.status(200).json({ status: 'ok', data: entries });
  } catch (error) {
    next(error);
  }
};
