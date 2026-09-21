import { Router, Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';

interface MasterService {
  list: (query: any) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (input: any) => Promise<any>;
  update: (id: string, input: any) => Promise<any>;
  updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => Promise<any>;
}

// Maps known error names to HTTP status codes without needing the exact
// error class imported here — keeps this factory usable across
// Transporter/Driver (via masterData.helper) and Vehicle (its own
// slightly different service) without tight coupling.
const errorStatusMap: Record<string, number> = {
  NotFoundError: 404,
  VehicleNotFoundError: 404,
  DuplicateCodeError: 409,
  DuplicateVehicleNumberError: 409,
};

const handleServiceError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof Error && errorStatusMap[error.name]) {
    return res.status(errorStatusMap[error.name]).json({ status: 'error', message: error.message });
  }
  next(error);
};

export const createMasterRouter = (
  service: MasterService,
  schemas: { create: ZodType; update: ZodType; status: ZodType; query: ZodType }
) => {
  const router = Router();

  // Admin-only, end to end — Transporter/Driver/Vehicle master data is
  // "driver/vehicle/transporter management", explicitly off-limits to
  // Staff and Transportation (Transportation only starts/delivers their
  // own assigned trips, via transportRecord.routes.ts, not this data).
  router.use(authenticate, authorize('ADMIN'));

  router.get('/', validateQuery(schemas.query), async (_req, res, next) => {
    try {
      const result = await service.list(res.locals.query);
      res.status(200).json({ status: 'ok', ...result });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await service.getById(req.params.id);
      res.status(200).json({ status: 'ok', data: record });
    } catch (error) {
      handleServiceError(error, res, next);
    }
  });

  router.post(
    '/',
    validateBody(schemas.create),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const record = await service.create(req.body);
        res.status(201).json({ status: 'ok', data: record });
      } catch (error) {
        handleServiceError(error, res, next);
      }
    }
  );

  router.put(
    '/:id',
    validateBody(schemas.update),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const record = await service.update(req.params.id, req.body);
        res.status(200).json({ status: 'ok', data: record });
      } catch (error) {
        handleServiceError(error, res, next);
      }
    }
  );

  router.patch(
    '/:id/status',
    validateBody(schemas.status),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const record = await service.updateStatus(req.params.id, req.body.status);
        res.status(200).json({ status: 'ok', data: record });
      } catch (error) {
        handleServiceError(error, res, next);
      }
    }
  );

  return router;
};
