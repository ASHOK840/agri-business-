import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

// The same green gradient banner used on the Dashboard, reused across
// every page so the app reads as one consistent product instead of a
// plain white title on some pages and a styled one on others.
const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <div className="rounded-lg bg-gradient-to-r from-green-700 to-green-800 text-white px-5 py-3.5 mb-5 flex items-center justify-between flex-wrap gap-3">
    <div>
      <h2 className="text-lg font-semibold leading-tight">{title}</h2>
      {subtitle && <p className="text-sm text-green-100 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default PageHeader;
