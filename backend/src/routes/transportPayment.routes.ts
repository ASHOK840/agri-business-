import { Router } from 'express';
import {
  getTransportPayments,
  getTransportPayment,
  getTransportRecordPaymentSummary,
  postTransportPayment,
} from '../controllers/transportPayment.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createTransportPaymentSchema,
  listTransportPaymentsQuerySchema,
} from '../validators/transportPayment.validator';

const router = Router();

// Admin-only, end to end — transport payments are explicitly off-limits
// to the simplified Transportation role (they only start/deliver trips)
// and to Staff.
//
// Deliberately no PUT/PATCH/DELETE route — a payment is immutable once
// recorded, same philosophy as BuyerPayment/WeighingRecord/SaleSettlement.
//
// Filtering /transport-payments by ?transporterId=... IS "transporter
// payment history" — no separate route needed, same pattern already
// used by BuyerPayment.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listTransportPaymentsQuerySchema), getTransportPayments);
router.get('/summary/:transportRecordId', getTransportRecordPaymentSummary);
router.get('/:id', getTransportPayment);
router.post('/', validateBody(createTransportPaymentSchema), postTransportPayment);

export default router;
