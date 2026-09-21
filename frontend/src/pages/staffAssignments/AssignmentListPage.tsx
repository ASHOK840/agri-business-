import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listAssignments, updateAssignmentStatus } from '../../services/staffAssignmentService';
import { listStaff } from '../../services/staffService';
import type { StaffAssignment, AssignmentStatus } from '../../types/staffAssignment.types';
import type { Staff } from '../../types/staff.types';
import AssignmentStatusBadge from '../../components/common/AssignmentStatusBadge';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { useConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const statusOptions: AssignmentStatus[] = ['ASSIGNED', 'COMPLETED', 'CANCELLED'];

const paymentBadgeClass: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
};

const AssignmentListPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirmDialog();

  useEffect(() => {
    listStaff({ limit: 100 }).then((res) => setStaffList(res.data));
  }, []);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAssignments({
        page,
        limit: 15,
        staffId: staffFilter || undefined,
        status: statusFilter || undefined,
      });
      setAssignments(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, staffFilter, statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    setPage(1);
  }, [staffFilter, statusFilter]);

  const handleStatusChange = async (assignment: StaffAssignment, status: AssignmentStatus) => {
    if (status === 'CANCELLED') {
      const confirmed = await confirm({
        title: 'Cancel this assignment?',
        message: `The assignment for ${assignment.staff.name} on ${assignment.purchase.purchaseNumber} will be cancelled. This cannot be undone.`,
        confirmLabel: 'Cancel Assignment',
        danger: true,
      });
      if (!confirmed) return;
    }
    setActingId(assignment.id);
    try {
      await updateAssignmentStatus(assignment.id, status);
      fetchAssignments();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <PageHeader
        title="Staff Assignments"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/staff-assignments/workload')}>
              Staff Workload
            </Button>
            <Button variant="secondary" onClick={() => navigate('/staff-assignments/new')}>+ Assign Staff</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <SelectField label="Staff" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">All staff</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssignmentStatus | '')}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading assignments..." />
        ) : assignments.length === 0 ? (
          <EmptyState message="No assignments found. Assign a staff member to a purchase to get started." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Purchase</th>
                <th className="px-4 py-2 font-medium">Staff</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Date</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Bags</th>
                <th className="px-4 py-2 font-medium">Labour Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Payment</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/staff-assignments/${a.id}`}
                      className="text-gray-800 hover:underline hover:text-green-700"
                    >
                      {a.purchase.purchaseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{a.staff.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {formatDate(a.assignedDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {a.bagsHandled ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(a.totalLabourAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <AssignmentStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-0.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${paymentBadgeClass[a.paymentStatus]}`}
                      >
                        {a.paymentStatus === 'PAID' ? 'Fully Paid' : a.paymentStatus}
                      </span>
                      {a.paymentStatus !== 'PAID' && (
                        <span className="text-xs text-red-600">
                          {formatCurrency(a.outstandingAmount)} due
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      {a.status === 'ASSIGNED' && (
                        <>
                          <Link
                            to={`/staff-assignments/${a.id}/edit`}
                            className="text-sm text-gray-500 hover:text-gray-800"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleStatusChange(a, 'COMPLETED')}
                            disabled={actingId === a.id}
                            className="text-sm text-green-700 hover:underline disabled:opacity-40"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(a, 'CANCELLED')}
                            disabled={actingId === a.id}
                            className="text-sm text-red-600 hover:underline disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <Link
                        to={`/staff-assignments/${a.id}`}
                        className="text-xs text-green-700 hover:underline"
                      >
                        View / Pay
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      {confirmDialog}
    </div>
  );
};

export default AssignmentListPage;
