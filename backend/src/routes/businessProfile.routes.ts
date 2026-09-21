import { Router } from 'express';
import { getProfile, putProfile, postLogo } from '../controllers/businessProfile.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody } from '../middleware/validateRequest.middleware';
import { businessProfileSchema } from '../validators/businessProfile.validator';
import { logoUpload } from '../config/upload';

const router = Router();

// ADMIN or STAFF can view the business profile — e.g. staff may need it
// for reference when printing bills later. TRANSPORTATION has no need
// for it and is excluded, consistent with "no other business modules".
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), getProfile);

// Only the ADMIN can edit business profile information.
router.put('/', authenticate, authorize('ADMIN'), validateBody(businessProfileSchema), putProfile);

// Only the ADMIN can upload/replace the business logo.
router.post('/logo', authenticate, authorize('ADMIN'), logoUpload.single('logo'), postLogo);

export default router;
