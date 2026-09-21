import { z } from 'zod';

const phonePattern = /^[0-9+\-\s()]{7,15}$/;
const codePattern = /^[A-Za-z0-9\-]{2,20}$/;

// --- Transporter -----------------------------------------------------
export const createTransporterSchema = z.object({
  transporterCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(codePattern, 'Code must be 2-20 letters, numbers or hyphens.')
    .optional()
    .or(z.literal('')),
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(200),
  phone: z.string().trim().regex(phonePattern, 'Enter a valid phone number.').optional().or(z.literal('')),
});
export const updateTransporterSchema = createTransporterSchema;
export const updateTransporterStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE.' }),
});

// --- Driver ------------------------------------------------------------
export const createDriverSchema = z.object({
  driverCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(codePattern, 'Code must be 2-20 letters, numbers or hyphens.')
    .optional()
    .or(z.literal('')),
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(200),
  phone: z.string().trim().regex(phonePattern, 'Enter a valid phone number.').optional().or(z.literal('')),
});
export const updateDriverSchema = createDriverSchema;
export const updateDriverStatusSchema = updateTransporterStatusSchema;

// --- Vehicle -------------------------------------------------------------
export const createVehicleSchema = z.object({
  vehicleNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Vehicle number is required.')
    .max(20, 'Vehicle number is too long.'),
  vehicleType: z.string().trim().max(50).optional().or(z.literal('')),
});
export const updateVehicleSchema = createVehicleSchema;
export const updateVehicleStatusSchema = updateTransporterStatusSchema;

// --- Shared list query ---------------------------------------------------
export const listMasterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateTransporterInput = z.infer<typeof createTransporterSchema>;
export type UpdateTransporterInput = z.infer<typeof updateTransporterSchema>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type UpdateStatusInput = z.infer<typeof updateTransporterStatusSchema>;
export type ListMasterQuery = z.infer<typeof listMasterQuerySchema>;
