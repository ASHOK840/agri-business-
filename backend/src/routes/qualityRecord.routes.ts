import { Router } from 'express';
import {
  getQualityRecords,
  getQualityRecord,
  postQualityRecord,
  putQualityRecord,
} from '../controllers/qualityRecord.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createQualityRecordSchema,
  updateQualityRecordSchema,
  listQualityRecordsQuerySchema,
} from '../validators/qualityRecord.validator';

const router = Router();

// Admin-only, end to end — quality assessments can change the selling
// price and are not part of the simplified Staff or Transportation roles.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listQualityRecordsQuerySchema), getQualityRecords);
router.get('/:id', getQualityRecord);
router.post('/', validateBody(createQualityRecordSchema), postQualityRecord);
router.put('/:id', validateBody(updateQualityRecordSchema), putQualityRecord);

export default router;
