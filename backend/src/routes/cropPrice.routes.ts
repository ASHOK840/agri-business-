import { Router } from 'express';
import {
  getCropPrices,
  getLatestCropPrices,
  getCropPrice,
  postCropPrice,
} from '../controllers/cropPrice.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validateBody, validateQuery } from '../middleware/validateRequest.middleware';
import {
  createCropPriceSchema,
  listCropPricesQuerySchema,
  latestCropPriceQuerySchema,
} from '../validators/cropPrice.validator';

const router = Router();

// Admin-only, end to end — "crop price administration" is explicitly
// off-limits to the simplified Staff role. Staff-recorded entries source
// their purchase rate internally from the latest price here (see
// staffEntry.service.ts) without ever calling this API directly.
//
// NOTE: there is deliberately no PUT or PATCH route here. Price records
// are immutable — a correction is a new POST, never an edit of an old row.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validateQuery(listCropPricesQuerySchema), getCropPrices);
router.get('/latest', validateQuery(latestCropPriceQuerySchema), getLatestCropPrices);
router.get('/:id', getCropPrice);
router.post('/', validateBody(createCropPriceSchema), postCropPrice);

export default router;
