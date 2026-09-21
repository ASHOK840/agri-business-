import { Router } from 'express';
import { getReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateQuery } from '../middleware/validateRequest.middleware';
import { reportQuerySchema } from '../validators/report.validator';

const router = Router();

// OWNER-only — reports surface the same financial detail (profit,
// outstanding balances, payment history) as the Owner Dashboard.
// ?format=csv streams a CSV download instead of the default JSON.
router.get('/:reportType', authenticate, authorize('ADMIN'), validateQuery(reportQuerySchema), getReport);

export default router;
