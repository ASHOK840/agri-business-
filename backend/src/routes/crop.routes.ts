import { Router } from 'express';
import { getCrops, getCrop, postCrop, putCrop, patchCropStatus } from '../controllers/crop.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createCropSchema,
  updateCropSchema,
  updateCropStatusSchema,
  listCropsQuerySchema,
} from '../validators/crop.validator';

const router = Router();

// Both ADMIN and STAFF can view crops (needed for the crop dropdown on
// the simplified Staff entry screen) — TRANSPORTATION cannot.
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), validateQuery(listCropsQuerySchema), getCrops);
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), getCrop);

// Only the ADMIN can create, edit, or change crop status.
router.post('/', authenticate, authorize('ADMIN'), validateBody(createCropSchema), postCrop);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateCropSchema), putCrop);
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validateBody(updateCropStatusSchema),
  patchCropStatus
);

export default router;
