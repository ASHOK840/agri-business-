import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFarmerPurchaseReceipt, getFarmerPaymentReceipt } from '../../services/documentService';
import type { FarmerReceiptDocument } from '../../types/document.types';
import DocumentLayout from '../../components/common/DocumentLayout';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import { formatCurrency, formatWeight } from '../../utils/format';

interface FarmerReceiptPageProps {
  kind: 'purchase' | 'payment';
}

const FarmerReceiptPage = ({ kind }: FarmerReceiptPageProps) => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const [doc, setDoc] = useState<FarmerReceiptDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!purchaseId) return;
    const fetcher = kind === 'purchase' ? getFarmerPurchaseReceipt : getFarmerPaymentReceipt;
    fetcher(purchaseId)
      .then(setDoc)
      .catch((err) => setError(err?.response?.data?.message || 'Could not load document.'))
      .finally(() => setIsLoading(false));
  }, [purchaseId, kind]);

  if (isLoading) {
    return <LoadingState label="Loading receipt..." />;
  }

  if (error || !doc) {
    return (
      <div className="max-w-2xl mx-auto mt-6">
        <Alert type="error" message={error || 'Could not load document.'} />
      </div>
    );
  }

  return (
    <DocumentLayout
      title={kind === 'purchase' ? 'Farmer Purchase Receipt' : 'Farmer Payment Receipt'}
      documentNumber={doc.documentNumber}
      date={doc.date}
      business={doc.business}
      backTo={`/purchases/${purchaseId}`}
      backLabel="Back to purchase"
    >
      <div className="mb-6 text-sm text-gray-700">
        <p className="font-medium text-gray-800">{doc.farmer.name}</p>
        <p className="text-gray-500">{doc.farmer.farmerCode}</p>
        {doc.farmer.village && <p className="text-gray-500">{doc.farmer.village}</p>}
        {doc.farmer.phone && <p className="text-gray-500">{doc.farmer.phone}</p>}
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
            <td className="py-2 text-gray-500">Weight</td>
            <td className="py-2 text-right text-gray-800">
              {doc.weightKg ? formatWeight(doc.weightKg) : '—'}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Purchase Rate</td>
            <td className="py-2 text-right text-gray-800">{formatCurrency(doc.purchaseRatePerKg)}/kg</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-700 font-medium">Gross Amount</td>
            <td className="py-2 text-right text-gray-900 font-semibold">
              {formatCurrency(doc.grossAmount)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Advance</td>
            <td className="py-2 text-right text-gray-800">{formatCurrency(doc.advance)}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Paid</td>
            <td className="py-2 text-right text-gray-800">{formatCurrency(doc.paid)}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-700 font-medium">Balance</td>
            <td className="py-2 text-right text-gray-900 font-semibold">
              {formatCurrency(doc.balance)}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        This is a system-generated {kind === 'purchase' ? 'purchase receipt' : 'payment receipt'}.
      </p>
    </DocumentLayout>
  );
};

export default FarmerReceiptPage;
