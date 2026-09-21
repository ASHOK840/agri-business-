import { Router } from 'express';
import { postStaffEntry, getMyStaffEntries } from '../controllers/staffEntry.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createStaffEntrySchema,
  listMyStaffEntriesQuerySchema,
} from '../validators/staffEntry.validator';

const router = Router();

// The entire Staff-facing surface for "record a farmer/crop entry".
// Internally reuses the existing Farmer/Purchase/WeighingRecord services
// and the existing AT_WAREHOUSE status transition (the only place stock-in
// happens) — see staffEntry.service.ts. Responses never include purchase
// rate or accounting figures.
router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.post('/', validateBody(createStaffEntrySchema), postStaffEntry);
router.get('/mine', validateQuery(listMyStaffEntriesQuerySchema), getMyStaffEntries);

export default router;
