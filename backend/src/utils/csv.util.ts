export interface ReportColumn {
  key: string;
  label: string;
}

// A single generic CSV serializer used by every report — see
// report.service.ts. Quotes any value containing a comma, quote, or
// newline, doubling embedded quotes per RFC 4180.
export const toCsv = (columns: ReportColumn[], rows: Record<string, unknown>[]): string => {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  return [header, ...lines].join('\r\n');
};
