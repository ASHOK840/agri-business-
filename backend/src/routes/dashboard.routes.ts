import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();

// OWNER-only — this surfaces profit, farmer/buyer outstanding balances,
// and other financially sensitive figures across the whole business,
// same bar as Staff Assignments and Business Profile. Read-only, entirely
// derived from live data — see dashboard.service.ts.
router.get('/', authenticate, authorize('ADMIN'), getDashboard);

export default router;
