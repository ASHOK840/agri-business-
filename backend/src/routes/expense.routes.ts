import { Router } from 'express';
import {
  getExpenses,
  getExpenseSummary,
  getExpense,
  postExpense,
  putExpense,
  patchExpenseCancel,
} from '../controllers/expense.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  cancelExpenseSchema,
  listExpensesQuerySchema,
  expenseSummaryQuerySchema,
} from '../validators/expense.validator';

const router = Router();

// Admin-only, end to end — expenses are accounting information,
// explicitly off-limits to Staff and Transportation. Deliberately no
// PUT/PATCH/DELETE analog beyond edit (while active) and cancel (soft,
// keeps audit history), never a hard delete of a financial record.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listExpensesQuerySchema), getExpenses);
router.get('/summary', validateQuery(expenseSummaryQuerySchema), getExpenseSummary);
router.get('/:id', getExpense);
router.post('/', validateBody(createExpenseSchema), postExpense);
router.put('/:id', validateBody(updateExpenseSchema), putExpense);
router.patch('/:id/cancel', validateBody(cancelExpenseSchema), patchExpenseCancel);

export default router;
