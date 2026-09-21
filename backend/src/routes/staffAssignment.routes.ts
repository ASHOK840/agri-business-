import { Router } from 'express';
import {
  getAssignments,
  getWorkload,
  getAssignment,
  postAssignment,
  putAssignment,
  patchAssignmentStatus,
} from '../controllers/staffAssignment.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createStaffAssignmentSchema,
  updateStaffAssignmentSchema,
  updateStaffAssignmentStatusSchema,
  listStaffAssignmentsQuerySchema,
  staffWorkloadQuerySchema,
} from '../validators/staffAssignment.validator';

const router = Router();

// Staff assignment and labour amounts are OWNER-only end to end, same
// pattern as the Staff module itself (Module 7) — this involves
// payroll-adjacent data, and "Owner assigns staff" frames this as an
// owner decision, not something staff self-manage.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listStaffAssignmentsQuerySchema), getAssignments);
router.get('/workload', validateQuery(staffWorkloadQuerySchema), getWorkload);
router.get('/:id', getAssignment);
router.post('/', validateBody(createStaffAssignmentSchema), postAssignment);
router.put('/:id', validateBody(updateStaffAssignmentSchema), putAssignment);
router.patch('/:id/status', validateBody(updateStaffAssignmentStatusSchema), patchAssignmentStatus);

export default router;
