import { z } from 'zod';
import { optionalUuid } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

const paymentMethodEnum = z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], {
  message: 'Invalid payment method.',
});

// StaffPayment is create + read ONLY — see the schema.prisma comment. A
// correction is a new payment row, never an edit of a past one.
export const createStaffPaymentSchema = z.object({
  assignmentId: uuidSchema,

  amount: z.coerce
    .number({ message: 'Amount must be a number.' })
    .positive('Amount must be greater than zero.')
    .max(100000000, 'Amount seems unreasonably high.'),

  paymentDate: z.coerce.date({ message: 'Enter a valid payment date.' }),

  paymentMethod: paymentMethodEnum,

  transactionReferenceNumber: z
    .string()
    .trim()
    .max(200, 'Transaction/reference number is too long.')
    .optional()
    .or(z.literal('')),

  notes: z.string().trim().max(1000, 'Notes are too long.').optional().or(z.literal('')),

  // See buyerPayment.validator.ts — same accidental-double-submission guard.
  force: z.boolean().optional(),
});

export const listStaffPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  assignmentId: optionalUuid(),
  staffId: optionalUuid(),
  paymentMethod: z.preprocess(
    (val) => (val === '' ? undefined : val),
    paymentMethodEnum.optional()
  ),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateStaffPaymentInput = z.infer<typeof createStaffPaymentSchema>;
export type ListStaffPaymentsQuery = z.infer<typeof listStaffPaymentsQuerySchema>;
