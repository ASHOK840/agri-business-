import { Request, Response, NextFunction } from 'express';
import * as staffService from '../services/staff.service';
import { DuplicateStaffCodeError, StaffNotFoundError } from '../services/staff.service';
import { ListStaffQuery } from '../validators/staff.validator';

export const getStaffList = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListStaffQuery;
    const result = await staffService.listStaff(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getStaffMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffMember = await staffService.getStaffById(req.params.id);
    res.status(200).json({ status: 'ok', data: staffMember });
  } catch (error) {
    if (error instanceof StaffNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const postStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffMember = await staffService.createStaff(req.body);
    res.status(201).json({ status: 'ok', data: staffMember });
  } catch (error) {
    if (error instanceof DuplicateStaffCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffMember = await staffService.updateStaff(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: staffMember });
  } catch (error) {
    if (error instanceof StaffNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof DuplicateStaffCodeError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchStaffStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffMember = await staffService.updateStaffStatus(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: staffMember });
  } catch (error) {
    if (error instanceof StaffNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
