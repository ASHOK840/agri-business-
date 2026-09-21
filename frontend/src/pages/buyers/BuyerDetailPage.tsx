import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBuyer, updateBuyerStatus } from '../../services/buyerService';
import { listBuyerPayments } from '../../services/buyerPaymentService';
import type { Buyer } from '../../types/buyer.types';
import type { BuyerPayment } from '../../types/buyerPayment.types';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import FutureSectionCard from '../../components/common/FutureSectionCard';
import { formatDate, formatCurrency } from '../../utils/format';

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const BuyerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [payments, setPayments] = useState<BuyerPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  useEffect(() => {
    if (!id) return;
    getBuyer(id)
      .then(setBuyer)
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    listBuyerPayments({ buyerId: id, limit: 50 })
      .then((res) => setPayments(res.data))
      .finally(() => setIsLoadingPayments(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!buyer) return;
    const nextStatus = buyer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsToggling(true);
    try {
      const updated = await updateBuyerStatus(buyer.id, nextStatus);
      setBuyer(updated);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading buyer...</div>;
  }

  if (!buyer) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-gray-500">
        Buyer not found.{' '}
        <Link to="/buyers" className="text-green-700 hover:underline">
          Back to buyer list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link to="/buyers" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Buyers
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{buyer.companyName}</h2>
          <p className="text-sm text-gray-500">{buyer.buyerCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={buyer.status} />
          <Button variant="secondary" onClick={() => navigate(`/buyers/${buyer.id}/edit`)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={handleToggleStatus} isLoading={isToggling}>
            {buyer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        {[
          ['Contact Person', buyer.contactPerson || '—'],
          ['Phone', buyer.phone || '—'],
          ['Address', buyer.address || '—'],
        ].map(([label, value]) => (
          <div key={label} className="px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-800 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Payment History
      </h3>
      {isLoadingPayments ? (
        <p className="text-sm text-gray-400 mb-6">Loading payment history...</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-6">
          No payments recorded yet from this buyer.
        </p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Payment #</th>
                <th className="px-4 py-2 font-medium">Sale #</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 text-gray-800 font-medium">{payment.paymentNumber}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/sales/${payment.sale.id}`}
                      className="text-green-700 hover:underline"
                    >
                      {payment.sale.saleNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Coming Later
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FutureSectionCard
          title="Sales"
          description="Crop sales made to this buyer will appear here once the Sales module is built."
        />
        <FutureSectionCard
          title="Price History"
          description="Historical selling rates negotiated with this buyer will be tracked here."
        />
        <FutureSectionCard
          title="Pending Amount"
          description="Any outstanding balance owed by this buyer will be shown here."
        />
        <FutureSectionCard
          title="Transaction History"
          description="A full timeline of sales and payments with this buyer will appear here."
        />
      </div>
    </div>
  );
};

export default BuyerDetailPage;
