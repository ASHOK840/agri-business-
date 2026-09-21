import * as vehicleService from '../services/vehicle.service';
import { createMasterRouter } from './masterDataRoute.helper';
import {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  listMasterQuerySchema,
} from '../validators/transportMaster.validator';

export default createMasterRouter(
  {
    list: vehicleService.listVehicles,
    getById: vehicleService.getVehicleById,
    create: vehicleService.createVehicle,
    update: vehicleService.updateVehicle,
    updateStatus: vehicleService.updateVehicleStatus,
  },
  {
    create: createVehicleSchema,
    update: updateVehicleSchema,
    status: updateVehicleStatusSchema,
    query: listMasterQuerySchema,
  }
);
