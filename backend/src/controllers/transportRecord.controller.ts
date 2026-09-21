import { Request, Response, NextFunction } from 'express';
import * as transportService from '../services/transportRecord.service';
import {
  TransporterNotFoundError,
  DriverNotFoundError,
  VehicleNotFoundError,
  PurchaseNotFoundError,
  BuyerNotFoundError,
  CropNotFoundError,
  TransportRecordNotFoundError,
  TerminalStatusError,
  InvalidAssignedUserError,
  ForbiddenTransportRecordError,
  InvalidTransportTransitionError,
} from '../services/transportRecord.service';
import { ListTransportQuery } from '../validators/transportRecord.validator';

const REFERENCE_ERRORS = [
  TransporterNotFoundError,
  DriverNotFoundError,
  VehicleNotFoundError,
  PurchaseNotFoundError,
  BuyerNotFoundError,
  CropNotFoundError,
];

export const getTransportRecords = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = res.locals.query as ListTransportQuery;
    const result = await transportService.listTransportRecords(query);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getCostSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purchaseId, dateFrom, dateTo } = req.query;
    const summary = await transportService.getTransportCostSummary({
      purchaseId: purchaseId as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });
    res.status(200).json({ status: 'ok', data: summary });
  } catch (error) {
    next(error);
  }
};

export const getTransportRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await transportService.getTransportRecordById(req.params.id);

    // Server-side ownership check — a TRANSPORTATION user must never be
    // able to view another user's trip by guessing/changing the ID in
    // the URL, even though the route itself is authenticated.
    if (req.user!.role === 'TRANSPORTATION' && record.assignedUser?.id !== req.user!.userId) {
      return res.status(403).json({ status: 'error', message: 'This trip is not assigned to you.' });
    }

    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof TransportRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

// The TRANSPORTATION role's entire "My Trips" list — server-side
// filtered to this user's own assigned, active trips.
export const getMyTransportRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await transportService.listMyAssignedTransportRecords(req.user!.userId);
    res.status(200).json({ status: 'ok', data: records });
  } catch (error) {
    next(error);
  }
};

export const postTransportRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await transportService.createTransportRecord(req.body, req.user!.userId);
    res.status(201).json({ status: 'ok', data: record });
  } catch (error) {
    if (REFERENCE_ERRORS.some((ErrClass) => error instanceof ErrClass)) {
      return res.status(400).json({ status: 'error', message: (error as Error).message });
    }
    if (error instanceof InvalidAssignedUserError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const putTransportRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await transportService.updateTransportRecord(req.params.id, req.body);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof TransportRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof TerminalStatusError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    if (REFERENCE_ERRORS.some((ErrClass) => error instanceof ErrClass)) {
      return res.status(400).json({ status: 'error', message: (error as Error).message });
    }
    if (error instanceof InvalidAssignedUserError) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

export const patchTransportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only the TRANSPORTATION route passes actor info, which triggers the
    // ownership + restricted-transition checks in the service. Admin's
    // own status route (same controller) is unaffected.
    const actor =
      req.user!.role === 'TRANSPORTATION'
        ? { userId: req.user!.userId, role: 'TRANSPORTATION' as const }
        : undefined;
    const record = await transportService.updateTransportStatus(req.params.id, req.body, actor);
    res.status(200).json({ status: 'ok', data: record });
  } catch (error) {
    if (error instanceof TransportRecordNotFoundError) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    if (error instanceof TerminalStatusError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    if (error instanceof ForbiddenTransportRecordError) {
      return res.status(403).json({ status: 'error', message: error.message });
    }
    if (error instanceof InvalidTransportTransitionError) {
      return res.status(409).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};
