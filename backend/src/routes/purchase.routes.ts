import { Router } from 'express';
import {
  getPurchases,
  getPurchase,
  postPurchase,
  putPurchase,
  patchPurchaseStatus,
} from '../controllers/purchase.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  updatePurchaseStatusSchema,
  listPurchasesQuerySchema,
} from '../validators/purchase.validator';

const router = Router();

// Admin-only, end to end. This full Purchase form/API (with purchase
// rate and amount fields) is not part of the simplified Staff role —
// Staff records a farmer/crop entry through the separate, narrow
// /staff-entries API instead, which reuses these same services
// internally without ever exposing rate/amount fields back to Staff.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listPurchasesQuerySchema), getPurchases);
router.get('/:id', getPurchase);
router.post('/', validateBody(createPurchaseSchema), postPurchase);

// NOTE: this update route deliberately cannot change farmerId, cropId,
// or purchaseRatePerKg — updatePurchaseSchema doesn't accept them, and
// the service layer never reads them from this input shape.
router.put('/:id', validateBody(updatePurchaseSchema), putPurchase);

router.patch('/:id/status', validateBody(updatePurchaseStatusSchema), patchPurchaseStatus);

export default router;
