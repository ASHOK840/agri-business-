import { Router } from 'express';
import {
  getStaffPayments,
  getStaffPayment,
  getAssignmentPaymentSummary,
  postStaffPayment,
} from '../controllers/staffPayment.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import { createStaffPaymentSchema, listStaffPaymentsQuerySchema } from '../validators/staffPayment.validator';

const router = Router();

// Payroll-adjacent data, same OWNER-only-end-to-end restriction as the
// rest of the Staff Assignment module (see staffAssignment.routes.ts).
//
// Deliberately no PUT/PATCH/DELETE route — a payment is immutable once
// recorded, same philosophy as TransportPayment/BuyerPayment.
//
// Filtering /staff-payments by ?staffId=... IS "staff payment history" —
// no separate route needed, same pattern already used by TransportPayment.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listStaffPaymentsQuerySchema), getStaffPayments);
router.get('/summary/:assignmentId', getAssignmentPaymentSummary);
router.get('/:id', getStaffPayment);
router.post('/', validateBody(createStaffPaymentSchema), postStaffPayment);

export default router;
