import type { TransportStatus } from '../../types/transportRecord.types';

const styles: Record<TransportStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600 border-gray-200',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const TransportStatusBadge = ({ status }: { status: TransportStatus }) => {
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

export default TransportStatusBadge;
