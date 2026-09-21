import { z } from 'zod';

// Indian PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// GSTIN is 15 characters (state code + PAN + entity code + checksum).
// A loose length/charset check is used here rather than a full checksum
// validation, since GSTIN rules vary and this is a data-entry field, not
// a tax-compliance validator.
const gstinPattern = /^[0-9A-Z]{15}$/;

export const businessProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters.')
    .max(200, 'Business name is too long.'),

  ownerName: z
    .string()
    .trim()
    .min(2, "Owner's name must be at least 2 characters.")
    .max(200, 'Owner name is too long.'),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,15}$/, 'Enter a valid phone number.')
    .optional()
    .or(z.literal('')),

  address: z.string().trim().max(500, 'Address is too long.').optional().or(z.literal('')),

  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(panPattern, 'PAN must be in the format ABCDE1234F.')
    .optional()
    .or(z.literal('')),

  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstinPattern, 'GSTIN must be 15 characters.')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
