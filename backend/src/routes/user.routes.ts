import { Router } from 'express';
import { getUsers, postUser, patchUserStatus, patchUserPassword } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createUserSchema,
  updateUserStatusSchema,
  resetUserPasswordSchema,
  listUsersQuerySchema,
} from '../validators/user.validator';

const router = Router();

// Admin-only, end to end. This is the entire account-provisioning
// surface for Staff and Transportation logins — there is no public
// signup anywhere in the app; the Father/Owner creates every account by
// hand here and hands out the username/password directly.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listUsersQuerySchema), getUsers);
router.post('/', validateBody(createUserSchema), postUser);
router.patch('/:id/status', validateBody(updateUserStatusSchema), patchUserStatus);
router.patch('/:id/password', validateBody(resetUserPasswordSchema), patchUserPassword);

export default router;
