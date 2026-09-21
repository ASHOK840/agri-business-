import { Router } from 'express';
import {
  getWeighingRecords,
  getWeighingRecord,
  postWeighingRecord,
} from '../controllers/weighingRecord.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createWeighingRecordSchema,
  listWeighingRecordsQuerySchema,
} from '../validators/weighingRecord.validator';

const router = Router();

// Admin-only, same as Purchases — Staff records a weighing implicitly
// through the simplified /staff-entries API (see staffEntry.service.ts),
// which calls createWeighingRecord internally.
//
// NOTE: deliberately no PUT/PATCH/DELETE route here. A weighing record is
// immutable once created — a re-weigh is a new POST, never an edit.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listWeighingRecordsQuerySchema), getWeighingRecords);
router.get('/:id', getWeighingRecord);
router.post('/', validateBody(createWeighingRecordSchema), postWeighingRecord);

export default router;
