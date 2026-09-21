import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBuyerPaymentReceipt } from '../../services/documentService';
import type { BuyerPaymentReceiptDocument } from '../../types/document.types';
import DocumentLayout from '../../components/common/DocumentLayout';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import { formatCurrency } from '../../utils/format';

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const BuyerPaymentReceiptPage = () => {
  const { buyerPaymentId } = useParams<{ buyerPaymentId: string }>();
  const [doc, setDoc] = useState<BuyerPaymentReceiptDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!buyerPaymentId) return;
    getBuyerPaymentReceipt(buyerPaymentId)
      .then(setDoc)
      .catch((err) => setError(err?.response?.data?.message || 'Could not load document.'))
      .finally(() => setIsLoading(false));
  }, [buyerPaymentId]);

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
      title="Buyer Payment Receipt"
      documentNumber={doc.documentNumber}
      date={doc.date}
      business={doc.business}
      backTo={`/sales/${doc.sale.id}`}
      backLabel="Back to sale"
    >
      <div className="mb-6 text-sm text-gray-700">
        <p className="font-medium text-gray-800">{doc.buyer.companyName}</p>
        <p className="text-gray-500">{doc.buyer.buyerCode}</p>
        {doc.buyer.contactPerson && <p className="text-gray-500">{doc.buyer.contactPerson}</p>}
        {doc.buyer.phone && <p className="text-gray-500">{doc.buyer.phone}</p>}
      </div>

      <table className="w-full text-sm mb-6">
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-2 text-gray-500">Sale / Crop</td>
            <td className="py-2 text-right text-gray-800 font-medium">
              {doc.sale.saleNumber} — {doc.sale.crop.name}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Payment Number</td>
            <td className="py-2 text-right text-gray-800">{doc.paymentNumber}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Payment Method</td>
            <td className="py-2 text-right text-gray-800">
              {paymentMethodLabels[doc.paymentMethod] || doc.paymentMethod}
            </td>
          </tr>
          {doc.transactionReferenceNumber && (
            <tr>
              <td className="py-2 text-gray-500">Reference</td>
              <td className="py-2 text-right text-gray-800">{doc.transactionReferenceNumber}</td>
            </tr>
          )}
          <tr>
            <td className="py-2 text-gray-700 font-medium">Amount Received</td>
            <td className="py-2 text-right text-green-800 font-semibold">
              {formatCurrency(doc.amount)}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-2 text-gray-500">Final Sale Amount</td>
            <td className="py-2 text-right text-gray-800">
              {formatCurrency(doc.finalSaleAmount)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-gray-500">Total Paid to Date</td>
            <td className="py-2 text-right text-gray-800">{formatCurrency(doc.totalPaidToDate)}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-700 font-medium">Outstanding Balance</td>
            <td className="py-2 text-right text-gray-900 font-semibold">
              {formatCurrency(doc.outstandingBalance)}
            </td>
          </tr>
        </tbody>
      </table>
    </DocumentLayout>
  );
};

export default BuyerPaymentReceiptPage;
