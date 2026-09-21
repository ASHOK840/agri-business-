import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBuyerSalesInvoice } from '../../services/documentService';
import type { BuyerSalesInvoiceDocument } from '../../types/document.types';
import DocumentLayout from '../../components/common/DocumentLayout';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import { formatCurrency, formatWeight, formatSignedCurrency } from '../../utils/format';

const BuyerSalesInvoicePage = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const [doc, setDoc] = useState<BuyerSalesInvoiceDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!saleId) return;
    getBuyerSalesInvoice(saleId)
      .then(setDoc)
      .catch((err) => setError(err?.response?.data?.message || 'Could not load document.'))
      .finally(() => setIsLoading(false));
  }, [saleId]);

  if (isLoading) {
    return <LoadingState label="Loading invoice..." />;
  }

  if (error || !doc) {
    return (
      <div className="max-w-2xl mx-auto mt-6">
        <Alert type="error" message={error || 'Could not load document.'} />
      </div>
    );
  }

  const hasSettlement = doc.finalBuyerWeightKg !== null;

  return (
    <DocumentLayout
      title="Sales Invoice / Dispatch Document"
      documentNumber={doc.documentNumber}
      date={doc.date}
      business={doc.business}
      backTo={`/sales/${saleId}`}
      backLabel="Back to sale"
    >
      <div className="mb-6 text-sm text-gray-700">
        <p className="font-medium text-gray-800">{doc.buyer.companyName}</p>
        <p className="text-gray-500">{doc.buyer.buyerCode}</p>
        {doc.buyer.contactPerson && <p className="text-gray-500">{doc.buyer.contactPerson}</p>}
        {doc.buyer.phone && <p className="text-gray-500">{doc.buyer.phone}</p>}
        {doc.buyer.address && <p className="text-gray-500">{doc.buyer.address}</p>}
      </div>

      <table className="w-full text-sm mb-6">
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-2 text-gray-500">Crop</td>
            <td className="py-2 text-right text-gray-800 font-medium">{doc.crop.name}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Bags</td>
            <td className="py-2 text-right text-gray-800">{doc.numberOfBags ?? '—'}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Dispatch Weight</td>
            <td className="py-2 text-right text-gray-800">
              {formatWeight(doc.dispatchWeightKg)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Selling Rate</td>
            <td className="py-2 text-right text-gray-800">{formatCurrency(doc.sellingRatePerKg)}/kg</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-700 font-medium">Expected Amount</td>
            <td className="py-2 text-right text-gray-900 font-semibold">
              {formatCurrency(doc.expectedAmount)}
            </td>
          </tr>

          {hasSettlement && (
            <>
              <tr>
                <td className="py-2 text-gray-500">Final Buyer Weight</td>
                <td className="py-2 text-right text-gray-800">
                  {formatWeight(doc.finalBuyerWeightKg)}
                </td>
              </tr>
              {doc.settlementAdjustment !== null && doc.settlementAdjustment !== 0 && (
                <tr>
                  <td className="py-2 text-gray-500">Settlement Adjustment</td>
                  <td className="py-2 text-right text-gray-800">
                    {formatSignedCurrency(doc.settlementAdjustment)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-2 text-gray-700 font-medium">Final Amount</td>
                <td className="py-2 text-right text-green-800 font-semibold">
                  {formatCurrency(doc.finalAmount)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {!hasSettlement && (
        <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
          Final buyer weight and settlement amount will appear here once the delivery settlement
          is recorded.
        </p>
      )}
    </DocumentLayout>
  );
};

export default BuyerSalesInvoicePage;
