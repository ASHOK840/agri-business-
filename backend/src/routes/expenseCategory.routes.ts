import { Router } from 'express';
import {
  getExpenseCategories,
  getExpenseCategory,
  postExpenseCategory,
  putExpenseCategory,
  patchExpenseCategoryStatus,
} from '../controllers/expenseCategory.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  updateExpenseCategoryStatusSchema,
  listExpenseCategoriesQuerySchema,
} from '../validators/expenseCategory.validator';

const router = Router();

// Admin-only, end to end — expense configuration is "business
// configuration", explicitly off-limits to Staff and Transportation.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listExpenseCategoriesQuerySchema), getExpenseCategories);
router.get('/:id', getExpenseCategory);
router.post('/', validateBody(createExpenseCategorySchema), postExpenseCategory);
router.put('/:id', validateBody(updateExpenseCategorySchema), putExpenseCategory);
router.patch('/:id/status', validateBody(updateExpenseCategoryStatusSchema), patchExpenseCategoryStatus);

export default router;
