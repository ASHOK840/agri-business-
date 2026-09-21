import { Router } from 'express';
import {
  getBuyers,
  getBuyer,
  postBuyer,
  putBuyer,
  patchBuyerStatus,
} from '../controllers/buyer.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createBuyerSchema,
  updateBuyerSchema,
  updateBuyerStatusSchema,
  listBuyersQuerySchema,
} from '../validators/buyer.validator';

const router = Router();

// Admin-only, end to end. Buyers are sales/accounting-adjacent data that
// the simplified Staff and Transportation roles must not see.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listBuyersQuerySchema), getBuyers);
router.get('/:id', getBuyer);
router.post('/', validateBody(createBuyerSchema), postBuyer);
router.put('/:id', validateBody(updateBuyerSchema), putBuyer);
router.patch('/:id/status', validateBody(updateBuyerStatusSchema), patchBuyerStatus);

export default router;
