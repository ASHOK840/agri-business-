import prisma from '../config/prismaClient';
import { createCodedMasterService } from './masterData.helper';

export const driverService = createCodedMasterService(
  prisma.driver,
  'driver',
  'driverCode',
  'DRV'
);
