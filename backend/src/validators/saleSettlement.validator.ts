import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');

const settlementStatusEnum = z.enum(['ACCEPTED', 'PRICE_ADJUSTED', 'REJECTED'], {
  message: 'Invalid settlement status.',
});

const rejectionActionEnum = z.enum(['RETURN_TO_WAREHOUSE', 'RESELL', 'DISPOSED_OTHER'], {
  message: 'Invalid rejection action.',
});

// The form always sends every field, even ones that don't apply to the
// chosen settlementStatus (e.g. adjustedSellingRatePerKg when ACCEPTED
// is picked) — as an empty string rather than omitting the key. Without
// this, z.coerce.number() turns '' into 0, which then fails a
// .positive() check on a field that was never meant to be required.
const emptyStringToUndefined = (val: unknown) => (val === '' ? undefined : val);

// SaleSettlement is create + read ONLY — see the schema.prisma comment.
// A correction is a new adjustmentAmount/adjustmentReason recorded at
// creation time, never an edit of an existing row.
//
// The buyer's outcome (Module 18) drives which fields are required:
//   ACCEPTED        — just the final weight, at the original rate.
//   PRICE_ADJUSTED  — final weight, PLUS the buyer's negotiated rate and
//                      a reason. The original rate is never touched.
//   REJECTED        — a rejection reason, the quantity affected, and
//                      what physically happened to the rejected goods.
export const createSaleSettlementSchema = z
  .object({
    saleId: uuidSchema,

    settlementStatus: settlementStatusEnum.optional().default('ACCEPTED'),

    // Required for ACCEPTED/PRICE_ADJUSTED (must be > 0). Allowed to be 0
    // for a full REJECTED settlement, where nothing was accepted.
    buyerFinalWeightKg: z.coerce
      .number({ message: 'Buyer final weight must be a number.' })
      .min(0, 'Buyer final weight cannot be negative.')
      .max(1000000, 'Buyer final weight seems unreasonably high.'),

    receivedDate: z.coerce.date({ message: 'Enter a valid received date.' }),

    buyerRemarks: z.string().trim().max(1000, 'Buyer remarks are too long.').optional().or(z.literal('')),

    // PRICE_ADJUSTED only.
    adjustedSellingRatePerKg: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ message: 'Adjusted selling rate must be a number.' })
        .positive('Adjusted selling rate must be greater than zero.')
        .max(100000, 'Adjusted selling rate seems unreasonably high.')
        .optional()
    ),
    priceAdjustmentReason: z
      .string()
      .trim()
      .max(500, 'Price adjustment reason is too long.')
      .optional()
      .or(z.literal('')),

    // REJECTED only.
    rejectionReason: z.string().trim().max(500, 'Rejection reason is too long.').optional().or(z.literal('')),
    quantityAffectedKg: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ message: 'Quantity affected must be a number.' })
        .positive('Quantity affected must be greater than zero.')
        .max(1000000, 'Quantity affected seems unreasonably high.')
        .optional()
    ),
    rejectionAction: z.preprocess(emptyStringToUndefined, rejectionActionEnum.optional()),
    rejectionActionNotes: z
      .string()
      .trim()
      .max(1000, 'Rejection action notes are too long.')
      .optional()
      .or(z.literal('')),

    // General-purpose escape hatch, independent of settlementStatus — see
    // schema.prisma comment. Defaults to 0, meaning no extra adjustment.
    adjustmentAmount: z.coerce
      .number({ message: 'Adjustment amount must be a number.' })
      .max(10000000, 'Adjustment amount seems unreasonably high.')
      .min(-10000000, 'Adjustment amount seems unreasonably low.')
      .optional()
      .default(0),
    adjustmentReason: z
      .string()
      .trim()
      .max(500, 'Adjustment reason is too long.')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.settlementStatus === 'PRICE_ADJUSTED') {
      if (data.buyerFinalWeightKg <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['buyerFinalWeightKg'],
          message: 'Buyer final weight must be greater than zero for a price-adjusted acceptance.',
        });
      }
      if (data.adjustedSellingRatePerKg === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['adjustedSellingRatePerKg'],
          message: 'Adjusted selling rate is required when the settlement is price-adjusted.',
        });
      }
      if (!data.priceAdjustmentReason) {
        ctx.addIssue({
          code: 'custom',
          path: ['priceAdjustmentReason'],
          message: 'A reason is required when the settlement is price-adjusted.',
        });
      }
    }

    if (data.settlementStatus === 'REJECTED') {
      if (!data.rejectionReason) {
        ctx.addIssue({
          code: 'custom',
          path: ['rejectionReason'],
          message: 'A rejection reason is required when the settlement is rejected.',
        });
      }
      if (data.quantityAffectedKg === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['quantityAffectedKg'],
          message: 'Quantity affected is required when the settlement is rejected.',
        });
      }
      if (!data.rejectionAction) {
        ctx.addIssue({
          code: 'custom',
          path: ['rejectionAction'],
          message: 'An action taken is required when the settlement is rejected.',
        });
      }
    }

    if (data.settlementStatus === 'ACCEPTED' && data.buyerFinalWeightKg <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['buyerFinalWeightKg'],
        message: 'Buyer final weight must be greater than zero for an accepted settlement.',
      });
    }
  });

export const listSaleSettlementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  saleId: uuidSchema.optional(),
  settlementStatus: settlementStatusEnum.optional(),
});

export type CreateSaleSettlementInput = z.infer<typeof createSaleSettlementSchema>;
export type ListSaleSettlementsQuery = z.infer<typeof listSaleSettlementsQuerySchema>;
