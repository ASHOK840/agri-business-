import { Router } from 'express';
import { getBusinessAlerts } from '../controllers/alert.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();

// OWNER-only — same bar as the Dashboard (Module 24): these alerts
// surface outstanding balances and other financially sensitive figures
// across the whole business. Read-only, entirely derived from live data.
router.get('/', authenticate, authorize('ADMIN'), getBusinessAlerts);

export default router;
