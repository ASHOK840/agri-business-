import { z } from 'zod';

// Every optional-field form in this app sends '' for a field the user
// left blank/unselected, rather than omitting the key — e.g. an
// "optional" purchaseId/saleId toggle set back to "None", or a
// PRICE_ADJUSTED-only field left alone on an ACCEPTED settlement.
// z.coerce.number()/.uuid()/z.enum() all treat '' as a real (invalid)
// value rather than "absent", so every .optional() field paired with
// one of those needs this preprocessing or it rejects the very
// "leave it blank" input the optional-ness was meant to allow.
export const emptyStringToUndefined = (val: unknown) => (val === '' ? undefined : val);

export const optionalUuid = (message = 'Invalid ID format.') =>
  z.preprocess(emptyStringToUndefined, z.string().uuid(message).optional());

// For an update schema's "explicit null clears the link, undefined
// leaves it unchanged" fields (see e.g. Expense.purchaseId/saleId) — the
// edit form always sends '' for "no link", which reads here as "clear
// it", the same as an explicit null.
export const optionalNullableUuid = (message = 'Invalid ID format.') =>
  z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid(message).nullable().optional()
  );
