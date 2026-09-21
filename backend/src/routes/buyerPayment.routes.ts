import { Router } from 'express';
import {
  getBuyerPayments,
  getBuyerPayment,
  getSalePaymentSummary,
  postBuyerPayment,
} from '../controllers/buyerPayment.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createBuyerPaymentSchema,
  listBuyerPaymentsQuerySchema,
} from '../validators/buyerPayment.validator';

const router = Router();

// Admin-only, end to end — buyer payments/accounting are not part of the
// simplified Staff or Transportation roles.
//
// Deliberately no PUT/PATCH/DELETE route — a payment is immutable once
// recorded, same philosophy as WeighingRecord and SaleSettlement.
//
// Filtering /buyer-payments by ?buyerId=... IS "buyer payment history" —
// no separate route needed, same pattern already used by Sales/Purchases.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listBuyerPaymentsQuerySchema), getBuyerPayments);
router.get('/summary/:saleId', getSalePaymentSummary);
router.get('/:id', getBuyerPayment);
router.post('/', validateBody(createBuyerPaymentSchema), postBuyerPayment);

export default router;
