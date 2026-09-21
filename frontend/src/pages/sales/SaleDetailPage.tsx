import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSale, updateSaleStatus } from '../../services/saleService';
import type { Sale, SaleStatus } from '../../types/sale.types';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import SaleSettlementSection from '../../components/common/SaleSettlementSection';
import SalePaymentSection from '../../components/common/SalePaymentSection';
import SaleStatusBadge from '../../components/common/SaleStatusBadge';
import { useConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatWeight, formatStatusLabel } from '../../utils/format';

// DELIVERED is deliberately excluded — it can only be reached by
// recording a buyer delivery settlement (see SaleSettlementSection),
// never by a direct status change.
const statusOptions: SaleStatus[] = ['PENDING', 'CONFIRMED', 'LOADED', 'DISPATCHED', 'CANCELLED'];

const SaleDetailPage = () => {
  const { id } = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { confirm, confirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (!id) return;

    setMessage(null);
    setIsLoading(true);
    getSale(id)
      .then(setSale)
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: SaleStatus) => {
    if (!id || !sale) return;

    if (newStatus === 'CANCELLED') {
      const confirmed = await confirm({
        title: 'Cancel this sale?',
        message:
          sale.status === 'DISPATCHED'
            ? `${sale.saleNumber} has already been dispatched — cancelling will return the dispatched stock to the warehouse. This cannot be undone.`
            : `${sale.saleNumber} will be marked cancelled. This cannot be undone.`,
        confirmLabel: 'Cancel Sale',
        danger: true,
      });
      if (!confirmed) return;
    }

    setMessage(null);
    setIsUpdatingStatus(true);
    try {
      const updated = await updateSaleStatus(id, newStatus);
      setSale(updated);
      setMessage({ type: 'success', text: `Status changed to ${newStatus}.` });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not update sale status.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading sale..." />;
  }

  if (!sale) {
    return <div className="text-center py-10 text-gray-400 text-sm">Sale not found.</div>;
  }

  const isTerminal = sale.status === 'DELIVERED' || sale.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="mb-4">
        <Link to="/sales" className="text-green-700 hover:underline text-sm">
          ← Back to sales
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sale</p>
            <h2 className="text-xl font-semibold text-gray-800">{sale.saleNumber}</h2>
            <Link to={`/sales/${sale.id}/invoice`} className="text-xs text-green-700 hover:underline">
              Invoice / Dispatch Document
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {sale.status === 'DELIVERED' && (
              <Link
                to={`/sales/${sale.id}/profit-loss`}
                className="text-sm text-green-700 hover:underline"
              >
                View Profit &amp; Loss
              </Link>
            )}
            <SaleStatusBadge status={sale.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 text-sm text-gray-700">
          <div>
            <p className="text-gray-500 mb-1">Buyer</p>
            <p className="font-medium text-gray-800">{sale.buyer.companyName}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Crop</p>
            <p className="font-medium text-gray-800">{sale.crop.name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Warehouse</p>
            <p>{sale.warehouse.name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Date</p>
            <p>{formatDate(sale.saleDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Dispatch weight</p>
            <p>{formatWeight(sale.dispatchWeightKg)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Selling rate</p>
            <p>{formatCurrency(sale.sellingRatePerKg)} / kg</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Expected revenue</p>
            <p className="font-semibold text-gray-900">{formatCurrency(sale.expectedRevenue)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Bags</p>
            <p>{sale.numberOfBags ?? '—'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-500 mb-1">Notes</p>
            <p>{sale.notes || '—'}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">Update status</label>
          {message && (
            <div className="mb-3">
              <Alert type={message.type} message={message.text} />
            </div>
          )}
          {isTerminal ? (
            <p className="text-xs text-gray-400">
              This sale is {sale.status.toLowerCase()} — no further status changes possible.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange(status)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    sale.status === status
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-700'
                  }`}
                >
                  {formatStatusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <SaleSettlementSection
            key={sale.id}
            saleId={sale.id}
            saleStatus={sale.status}
            dispatchWeightKg={sale.dispatchWeightKg}
            sellingRatePerKg={sale.sellingRatePerKg}
            onSettled={() => {
              if (id) getSale(id).then(setSale);
            }}
          />
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <SalePaymentSection key={sale.id} saleId={sale.id} />
        </div>
      </div>
      {confirmDialog}
    </div>
  );
};

export default SaleDetailPage;
