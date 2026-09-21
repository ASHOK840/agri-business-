import type { PurchaseStatus } from '../../types/purchase.types';

const styles: Record<PurchaseStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600 border-gray-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  COLLECTED: 'bg-amber-50 text-amber-700 border-amber-200',
  AT_WAREHOUSE: 'bg-purple-50 text-purple-700 border-purple-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const labels: Record<PurchaseStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COLLECTED: 'Collected',
  AT_WAREHOUSE: 'At Warehouse',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PurchaseStatusBadge = ({ status }: { status: PurchaseStatus }) => {
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default PurchaseStatusBadge;
