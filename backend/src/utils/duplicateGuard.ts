// Guards financial creation endpoints (Purchase, Sale, Expense,
// BuyerPayment) against accidental double-submission — a double-click
// on "Save", or a network retry resubmitting the same request. This is
// deliberately narrow: it only flags a record whose defining fields are
// IDENTICAL to one the same user just created within a few seconds. It
// never blocks two genuinely separate transactions (e.g. buying from
// the same farmer at the same rate twice in one day), since real
// duplicates like that won't share a sub-15-second createdAt window.
//
// Mirrors the "possible duplicate" pattern already used for farmers
// (see PossibleDuplicateFarmerError) — soft-block, resubmit with
// `force: true` to confirm it's intentional.
export class DuplicateSubmissionError extends Error {
  constructor(entityLabel: string) {
    super(
      `An identical ${entityLabel} was just submitted a few seconds ago. ` +
        `If this is a separate, intentional transaction, resubmit with force: true.`
    );
    this.name = 'DuplicateSubmissionError';
  }
}

export const DUPLICATE_SUBMISSION_WINDOW_MS = 15_000;

export const assertNoRecentDuplicate = async (
  entityLabel: string,
  findRecent: () => Promise<unknown>,
  force: boolean | undefined
): Promise<void> => {
  if (force) return;

  const existing = await findRecent();
  if (existing) {
    throw new DuplicateSubmissionError(entityLabel);
  }
};
