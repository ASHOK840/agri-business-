import { Router } from 'express';
import {
  getFarmers,
  getFarmer,
  postFarmer,
  putFarmer,
  patchFarmerStatus,
} from '../controllers/farmer.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createFarmerSchema,
  updateFarmerSchema,
  updateFarmerStatusSchema,
  listFarmersQuerySchema,
} from '../validators/farmer.validator';

const router = Router();

// Farmer lookup/create/update is part of Staff's actual job (recording
// farmer/crop entries), so both ADMIN and STAFF can reach it —
// TRANSPORTATION cannot. Deactivating a farmer record is an
// administrative action, kept ADMIN-only.
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), validateQuery(listFarmersQuerySchema), getFarmers);
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), getFarmer);
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), validateBody(createFarmerSchema), postFarmer);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), validateBody(updateFarmerSchema), putFarmer);
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validateBody(updateFarmerStatusSchema),
  patchFarmerStatus
);

export default router;
