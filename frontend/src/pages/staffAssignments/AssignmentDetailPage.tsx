import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAssignment } from '../../services/staffAssignmentService';
import type { StaffAssignment } from '../../types/staffAssignment.types';
import LoadingState from '../../components/common/LoadingState';
import AssignmentStatusBadge from '../../components/common/AssignmentStatusBadge';
import StaffPaymentSection from '../../components/common/StaffPaymentSection';
import { formatCurrency, formatDate } from '../../utils/format';

const AssignmentDetailPage = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<StaffAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getAssignment(id)
      .then(setAssignment)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <LoadingState label="Loading assignment..." />;
  }

  if (!assignment) {
    return <div className="text-center py-10 text-gray-400 text-sm">Assignment not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="mb-4">
        <Link to="/staff-assignments" className="text-green-700 hover:underline text-sm">
          ← Back to staff assignments
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {assignment.purchase.purchaseNumber}
            </p>
            <h2 className="text-xl font-semibold text-gray-800">{assignment.staff.name}</h2>
          </div>
          <AssignmentStatusBadge status={assignment.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 text-sm text-gray-700">
          <div>
            <p className="text-gray-500 mb-1">Purchase</p>
            <p className="font-medium text-gray-800">{assignment.purchase.purchaseNumber}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Staff</p>
            <p className="font-medium text-gray-800">
              {assignment.staff.name} ({assignment.staff.staffCode})
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Assigned Date</p>
            <p>{formatDate(assignment.assignedDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Bags Handled</p>
            <p>{assignment.bagsHandled ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Labour Rate per Bag</p>
            <p>{formatCurrency(assignment.labourRatePerBag)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Labour Amount</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(assignment.totalLabourAmount)}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <StaffPaymentSection key={assignment.id} assignmentId={assignment.id} />
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
