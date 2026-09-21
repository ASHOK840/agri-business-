// Centralized formatting so every page shows money, weight, and dates
// the same way — a business owner comparing two screens should never
// see the same number formatted two different ways.

// Accepts null/undefined explicitly (rather than letting them flow into
// Number(), where null silently becomes 0) so a genuinely-missing value
// — e.g. a settlement amount before the sale is settled — always reads
// as "—", never a misleading ₹0.00.
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '—';
  const value = Number(amount);
  if (Number.isNaN(value)) return '—';
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatSignedCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '—';
  const value = Number(amount);
  if (Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
};

export const formatWeight = (kg: number | string | null | undefined): string => {
  if (kg === null || kg === undefined) return '—';
  const value = Number(kg);
  if (Number.isNaN(value)) return '—';
  return `${value.toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg`;
};

export const formatSignedWeight = (kg: number | string | null | undefined): string => {
  if (kg === null || kg === undefined) return '—';
  const value = Number(kg);
  if (Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatWeight(value)}`;
};

export const formatPercent = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Turns an ENUM_STYLE_STATUS into "Enum style status" for display.
export const formatStatusLabel = (status: string): string =>
  status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
