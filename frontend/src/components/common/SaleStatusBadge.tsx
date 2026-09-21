import type { SaleStatus } from '../../types/sale.types';

const styles: Record<SaleStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600 border-gray-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  LOADED: 'bg-amber-50 text-amber-700 border-amber-200',
  DISPATCHED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const labels: Record<SaleStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  LOADED: 'Loaded',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const SaleStatusBadge = ({ status }: { status: SaleStatus }) => {
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default SaleStatusBadge;
