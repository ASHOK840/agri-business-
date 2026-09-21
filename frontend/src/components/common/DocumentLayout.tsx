import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BusinessDocumentInfo } from '../../types/document.types';
import Button from './Button';
import { formatDate } from '../../utils/format';

interface DocumentLayoutProps {
  title: string;
  documentNumber: string;
  date: string;
  business: BusinessDocumentInfo;
  backTo: string;
  backLabel: string;
  children: ReactNode;
}

const DocumentLayout = ({
  title,
  documentNumber,
  date,
  business,
  backTo,
  backLabel,
  children,
}: DocumentLayoutProps) => {
  return (
    <div className="max-w-2xl mx-auto mt-6 mb-10">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to={backTo} className="text-green-700 hover:underline text-sm">
          ← {backLabel}
        </Link>
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8 print:border-0 print:p-0 print:rounded-none">
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {business.businessName || 'Business Name Not Configured'}
            </h1>
            {business.ownerName && <p className="text-sm text-gray-600">Owner: {business.ownerName}</p>}
            {business.address && <p className="text-sm text-gray-600">{business.address}</p>}
            <p className="text-sm text-gray-600">
              {[business.phone, business.pan ? `PAN: ${business.pan}` : null, business.gstin ? `GSTIN: ${business.gstin}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">{documentNumber}</p>
            <p className="text-sm text-gray-500">{formatDate(date)}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default DocumentLayout;
