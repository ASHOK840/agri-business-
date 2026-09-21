import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');

const paymentMethodEnum = z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], {
  message: 'Invalid payment method.',
});

// TransportPayment is create + read ONLY — see the schema.prisma comment. A
// correction is a new payment row, never an edit of a past one.
export const createTransportPaymentSchema = z.object({
  transportRecordId: uuidSchema,

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

export const listTransportPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  transportRecordId: uuidSchema.optional(),
  transporterId: uuidSchema.optional(),
  paymentMethod: paymentMethodEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateTransportPaymentInput = z.infer<typeof createTransportPaymentSchema>;
export type ListTransportPaymentsQuery = z.infer<typeof listTransportPaymentsQuerySchema>;
