import { Router } from 'express';
import {
  getSaleSettlements,
  getSaleSettlement,
  getSaleSettlementForSale,
  postSaleSettlement,
} from '../controllers/saleSettlement.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createSaleSettlementSchema,
  listSaleSettlementsQuerySchema,
} from '../validators/saleSettlement.validator';

const router = Router();

// Admin-only, end to end — sales/settlement data is not part of the
// simplified Staff or Transportation roles.
//
// Deliberately no PUT/PATCH/DELETE route — a settlement is immutable
// once recorded, same philosophy as WeighingRecord.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listSaleSettlementsQuerySchema), getSaleSettlements);
router.get('/by-sale/:saleId', getSaleSettlementForSale);
router.get('/:id', getSaleSettlement);
router.post('/', validateBody(createSaleSettlementSchema), postSaleSettlement);

export default router;
