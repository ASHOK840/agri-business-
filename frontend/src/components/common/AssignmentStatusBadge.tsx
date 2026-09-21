import type { AssignmentStatus } from '../../types/staffAssignment.types';

const styles: Record<AssignmentStatus, string> = {
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const AssignmentStatusBadge = ({ status }: { status: AssignmentStatus }) => {
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

export default AssignmentStatusBadge;
