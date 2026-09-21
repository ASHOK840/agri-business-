import { transporterService } from '../services/transporter.service';
import { createMasterRouter } from './masterDataRoute.helper';
import {
  createTransporterSchema,
  updateTransporterSchema,
  updateTransporterStatusSchema,
  listMasterQuerySchema,
} from '../validators/transportMaster.validator';

export default createMasterRouter(transporterService, {
  create: createTransporterSchema,
  update: updateTransporterSchema,
  status: updateTransporterStatusSchema,
  query: listMasterQuerySchema,
});
