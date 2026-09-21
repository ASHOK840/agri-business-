import { Router } from 'express';
import { getSaleProfitLoss } from '../controllers/profitLoss.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();

// Admin-only — profit/loss is explicitly off-limits to Staff and
// Transportation. Read-only, entirely a derived calculation, never a
// stored record, so there is nothing to create/edit/delete here.
router.get('/:saleId', authenticate, authorize('ADMIN'), getSaleProfitLoss);

export default router;
