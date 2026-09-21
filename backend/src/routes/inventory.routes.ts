import { Router } from 'express';
import {
  getStock,
  getMovements,
  getMovement,
  postDispatch,
  postAdjustment,
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createDispatchSchema,
  createAdjustmentSchema,
  listMovementsQuerySchema,
  stockQuerySchema,
} from '../validators/inventory.validator';

const router = Router();

// Admin-only, end to end. "Staff must NOT see inventory/stock quantities"
// and Transportation has no business need for it either — Purchase's own
// AT_WAREHOUSE transition still creates IN movements automatically
// regardless of who triggered it (see purchase.service.ts).
router.use(authenticate, authorize('ADMIN'));

router.get('/stock', validateQuery(stockQuerySchema), getStock);
router.get('/movements', validateQuery(listMovementsQuerySchema), getMovements);
router.get('/movements/:id', getMovement);

// Dispatch (OUT) — records crop leaving for sale. Blocked server-side if
// it would exceed available stock.
router.post('/dispatch', validateBody(createDispatchSchema), postDispatch);

// Adjustment — the "authorized adjustment process" the requirements call
// for, deliberately gated to a higher permission level since it can
// override the normal stock-availability check.
router.post('/adjustments', validateBody(createAdjustmentSchema), postAdjustment);

// NOTE: there is intentionally NO route here for creating an IN
// movement directly. IN movements are only ever created automatically
// by the Purchase service (see purchase.service.ts) when a purchase
// reaches AT_WAREHOUSE status. This is "do not allow normal users to
// manually overwrite calculated stock" enforced structurally.

export default router;
