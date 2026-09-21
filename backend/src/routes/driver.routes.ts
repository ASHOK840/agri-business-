import { driverService } from '../services/driver.service';
import { createMasterRouter } from './masterDataRoute.helper';
import {
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  listMasterQuerySchema,
} from '../validators/transportMaster.validator';

export default createMasterRouter(driverService, {
  create: createDriverSchema,
  update: updateDriverSchema,
  status: updateDriverStatusSchema,
  query: listMasterQuerySchema,
});
