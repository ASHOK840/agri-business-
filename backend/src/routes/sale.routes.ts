import { Router } from 'express';
import { getSales, getSale, postSale, patchSaleStatus } from '../controllers/sale.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createSaleSchema,
  listSalesQuerySchema,
  updateSaleStatusSchema,
} from '../validators/sale.validator';

const router = Router();

// Admin-only, end to end — sales are explicitly off-limits to the
// simplified Staff and Transportation roles.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listSalesQuerySchema), getSales);
router.get('/:id', getSale);
router.post('/', validateBody(createSaleSchema), postSale);
router.patch('/:id/status', validateBody(updateSaleStatusSchema), patchSaleStatus);

export default router;
