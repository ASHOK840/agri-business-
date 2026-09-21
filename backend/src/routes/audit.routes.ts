import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateQuery } from '../middleware/validateRequest.middleware';
import { listAuditLogsQuerySchema } from '../validators/audit.validator';

const router = Router();

// OWNER-only, read-only — an audit trail that could itself be edited or
// deleted (or even just viewed by non-owners) defeats its own purpose.
router.get('/', authenticate, authorize('ADMIN'), validateQuery(listAuditLogsQuerySchema), getAuditLogs);

export default router;
