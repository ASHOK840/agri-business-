import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTransportRecord } from '../../services/transportRecordService';
import type { TransportRecord } from '../../types/transportRecord.types';
import LoadingState from '../../components/common/LoadingState';
import TransportStatusBadge from '../../components/common/TransportStatusBadge';
import TransportPaymentSection from '../../components/common/TransportPaymentSection';
import { formatCurrency, formatDate, formatWeight } from '../../utils/format';

const directionLabels: Record<TransportRecord['direction'], string> = {
  FARMER_TO_WAREHOUSE: 'Farmer → Warehouse',
  WAREHOUSE_TO_BUYER: 'Warehouse → Buyer',
};

const TransportRecordDetailPage = () => {
  const { id } = useParams();
  const [record, setRecord] = useState<TransportRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getTransportRecord(id)
      .then(setRecord)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <LoadingState label="Loading transport record..." />;
  }

  if (!record) {
    return <div className="text-center py-10 text-gray-400 text-sm">Transport record not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="mb-4">
        <Link to="/transport-records" className="text-green-700 hover:underline text-sm">
          ← Back to transportation
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {directionLabels[record.direction]}
            </p>
            <h2 className="text-xl font-semibold text-gray-800">
              {record.fromLocation} → {record.toLocation}
            </h2>
          </div>
          <TransportStatusBadge status={record.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 text-sm text-gray-700">
          <div>
            <p className="text-gray-500 mb-1">Crop</p>
            <p className="font-medium text-gray-800">{record.crop.name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Transporter</p>
            <p className="font-medium text-gray-800">{record.transporter.name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Driver</p>
            <p>{record.driver?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Vehicle</p>
            <p>{record.vehicle?.vehicleNumber ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Transport Date</p>
            <p>{formatDate(record.transportDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Bags</p>
            <p>{record.numberOfBags ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Weight</p>
            <p>{formatWeight(record.weightKg)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Transport Cost</p>
            <p className="font-semibold text-gray-900">{formatCurrency(record.transportCost)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-500 mb-1">Notes</p>
            <p>{record.notes || '—'}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <TransportPaymentSection key={record.id} transportRecordId={record.id} />
        </div>
      </div>
    </div>
  );
};

export default TransportRecordDetailPage;
