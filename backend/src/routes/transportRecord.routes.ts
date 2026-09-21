import { Router } from 'express';
import {
  getTransportRecords,
  getCostSummary,
  getTransportRecord,
  getMyTransportRecords,
  postTransportRecord,
  putTransportRecord,
  patchTransportStatus,
} from '../controllers/transportRecord.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createTransportRecordSchema,
  updateTransportRecordSchema,
  updateTransportStatusSchema,
  listTransportQuerySchema,
} from '../validators/transportRecord.validator';

const router = Router();

// Full transport management (list-all, create, edit, cost summary) is
// Admin-only — "transport management" is explicitly off-limits to Staff,
// and Transportation only ever sees its own assigned trips (below).
router.get('/', authenticate, authorize('ADMIN'), validateQuery(listTransportQuerySchema), getTransportRecords);
router.get('/cost-summary', authenticate, authorize('ADMIN'), getCostSummary);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createTransportRecordSchema), postTransportRecord);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateTransportRecordSchema), putTransportRecord);

// The TRANSPORTATION role's entire surface: their own assigned trips,
// starting a trip, and marking it delivered. listMyAssignedTransportRecords
// filters by assignedUserId server-side — never a generic list.
router.get('/my-trips', authenticate, authorize('TRANSPORTATION'), getMyTransportRecords);

// Shared by ADMIN (full access, any record/transition) and TRANSPORTATION
// (own assigned record only, restricted PENDING→IN_TRANSIT/IN_TRANSIT→
// DELIVERED transitions only) — the ownership + transition checks live in
// the controller/service, not just route-level role gating.
router.get('/:id', authenticate, authorize('ADMIN', 'TRANSPORTATION'), getTransportRecord);
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'TRANSPORTATION'),
  validateBody(updateTransportStatusSchema),
  patchTransportStatus
);

export default router;
