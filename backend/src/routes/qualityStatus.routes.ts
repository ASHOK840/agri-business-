import { Router } from 'express';
import {
  getQualityStatuses,
  getQualityStatus,
  postQualityStatus,
  putQualityStatus,
  patchQualityStatusStatus,
} from '../controllers/qualityStatus.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createQualityStatusSchema,
  updateQualityStatusSchema,
  updateQualityStatusStatusSchema,
  listQualityStatusesQuerySchema,
} from '../validators/qualityStatus.validator';

const router = Router();

// Admin-only, end to end — quality configuration/assessment is not part
// of the simplified Staff or Transportation roles.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listQualityStatusesQuerySchema), getQualityStatuses);
router.get('/:id', getQualityStatus);
router.post('/', validateBody(createQualityStatusSchema), postQualityStatus);
router.put('/:id', validateBody(updateQualityStatusSchema), putQualityStatus);
router.patch('/:id/status', validateBody(updateQualityStatusStatusSchema), patchQualityStatusStatus);

export default router;
