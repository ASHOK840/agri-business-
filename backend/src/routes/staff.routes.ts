import { Router } from 'express';
import {
  getStaffList,
  getStaffMember,
  postStaff,
  putStaff,
  patchStaffStatus,
} from '../controllers/staff.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  listStaffQuerySchema,
} from '../validators/staff.validator';

const router = Router();

// Staff management is OWNER-only end to end — unlike Farmers/Crops,
// there's no "staff can view" case here, since staff records are
// internal HR-type data, not something field staff need to browse.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listStaffQuerySchema), getStaffList);
router.get('/:id', getStaffMember);
router.post('/', validateBody(createStaffSchema), postStaff);
router.put('/:id', validateBody(updateStaffSchema), putStaff);
router.patch('/:id/status', validateBody(updateStaffStatusSchema), patchStaffStatus);

export default router;
