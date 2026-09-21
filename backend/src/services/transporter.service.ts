import prisma from '../config/prismaClient';
import { createCodedMasterService } from './masterData.helper';

export const transporterService = createCodedMasterService(
  prisma.transporter,
  'transporter',
  'transporterCode',
  'TRN'
);
