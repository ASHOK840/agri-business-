import { z } from 'zod';
import { emptyStringToUndefined } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

export const createStaffAssignmentSchema = z.object({
  purchaseId: uuidSchema,
  staffId: uuidSchema,

  assignedDate: z.coerce.date({ message: 'Enter a valid assigned date.' }),

  bagsHandled: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .int('Bags handled must be a whole number.')
      .positive('Bags handled must be greater than zero.')
      .optional()
  ),

  // Configurable, never hard-coded — e.g. ₹5/bag is just this business's
  // current example rate, not a constant anywhere in the code.
  labourRatePerBag: z.coerce
    .number({ message: 'Labour rate must be a number.' })
    .positive('Labour rate must be greater than zero.')
    .max(10000, 'Labour rate seems unreasonably high — please check.'),
});

// Update: bagsHandled and labourRatePerBag can be corrected while the
// assignment is still active — purchaseId/staffId are NOT editable here
// (reassigning to a different purchase or staff member is a new
// assignment, not an edit of this one).
export const updateStaffAssignmentSchema = z.object({
  assignedDate: z.coerce.date({ message: 'Enter a valid assigned date.' }).optional(),

  bagsHandled: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .int('Bags handled must be a whole number.')
      .positive('Bags handled must be greater than zero.')
      .optional()
  ),

  labourRatePerBag: z.coerce
    .number()
    .positive('Labour rate must be greater than zero.')
    .optional(),
});

export const updateStaffAssignmentStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'COMPLETED', 'CANCELLED'], {
    message: 'Invalid assignment status.',
  }),
});

export const listStaffAssignmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  purchaseId: uuidSchema.optional(),
  staffId: uuidSchema.optional(),
  status: z.enum(['ASSIGNED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const staffWorkloadQuerySchema = z.object({
  staffId: uuidSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateStaffAssignmentInput = z.infer<typeof createStaffAssignmentSchema>;
export type UpdateStaffAssignmentInput = z.infer<typeof updateStaffAssignmentSchema>;
export type UpdateStaffAssignmentStatusInput = z.infer<typeof updateStaffAssignmentStatusSchema>;
export type ListStaffAssignmentsQuery = z.infer<typeof listStaffAssignmentsQuerySchema>;
export type StaffWorkloadQuery = z.infer<typeof staffWorkloadQuerySchema>;
