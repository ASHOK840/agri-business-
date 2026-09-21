import { z } from 'zod';
import { optionalUuid, optionalNullableUuid } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

const paymentMethodEnum = z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], {
  message: 'Invalid payment method.',
});

// At most one of purchaseId/saleId may be set — an expense relates to
// either a specific purchase or a specific sale, never both at once.
const relatedRefinement = (data: { purchaseId?: string; saleId?: string }, ctx: z.RefinementCtx) => {
  if (data.purchaseId && data.saleId) {
    ctx.addIssue({
      code: 'custom',
      path: ['saleId'],
      message: 'An expense can relate to a purchase or a sale, not both.',
    });
  }
};

export const createExpenseSchema = z
  .object({
    categoryId: uuidSchema,

    amount: z.coerce
      .number({ message: 'Amount must be a number.' })
      .positive('Amount must be greater than zero.')
      .max(100000000, 'Amount seems unreasonably high.'),

    expenseDate: z.coerce.date({ message: 'Enter a valid expense date.' }),

    description: z.string().trim().max(1000, 'Description is too long.').optional().or(z.literal('')),

    purchaseId: optionalUuid(),
    saleId: optionalUuid(),

    paymentMethod: paymentMethodEnum,
    referenceNumber: z
      .string()
      .trim()
      .max(200, 'Reference number is too long.')
      .optional()
      .or(z.literal('')),

    // See purchase.validator.ts — same accidental-double-submission guard.
    force: z.boolean().optional(),
  })
  .superRefine(relatedRefinement);

export const updateExpenseSchema = z
  .object({
    categoryId: uuidSchema.optional(),

    amount: z.coerce
      .number({ message: 'Amount must be a number.' })
      .positive('Amount must be greater than zero.')
      .max(100000000, 'Amount seems unreasonably high.')
      .optional(),

    expenseDate: z.coerce.date({ message: 'Enter a valid expense date.' }).optional(),

    description: z.string().trim().max(1000, 'Description is too long.').optional().or(z.literal('')),

    // Explicitly settable to null to clear a previous link — undefined
    // means "leave unchanged".
    purchaseId: optionalNullableUuid(),
    saleId: optionalNullableUuid(),

    paymentMethod: paymentMethodEnum.optional(),
    referenceNumber: z
      .string()
      .trim()
      .max(200, 'Reference number is too long.')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.purchaseId && data.saleId) {
      ctx.addIssue({
        code: 'custom',
        path: ['saleId'],
        message: 'An expense can relate to a purchase or a sale, not both.',
      });
    }
  });

export const cancelExpenseSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .max(500, 'Cancellation reason is too long.')
    .optional()
    .or(z.literal('')),
});

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  categoryId: uuidSchema.optional(),
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  purchaseId: uuidSchema.optional(),
  saleId: uuidSchema.optional(),
  paymentMethod: paymentMethodEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const expenseSummaryQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CancelExpenseInput = z.infer<typeof cancelExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type ExpenseSummaryQuery = z.infer<typeof expenseSummaryQuerySchema>;
