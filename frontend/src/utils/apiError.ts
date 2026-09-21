interface FieldError {
  field: string;
  message: string;
}

// The backend's validateBody middleware always responds with a generic
// "Validation failed." message plus a per-field `errors` array — this
// surfaces the actual field messages instead of that generic text, which
// on its own tells the user nothing about what to fix.
export const extractErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: string; errors?: FieldError[] } } })
    ?.response?.data;
  const fieldErrors = data?.errors;
  if (fieldErrors && fieldErrors.length > 0) {
    return fieldErrors.map((e) => e.message).join(' ');
  }
  return data?.message || fallback;
};
