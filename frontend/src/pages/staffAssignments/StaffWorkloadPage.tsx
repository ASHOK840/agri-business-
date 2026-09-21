import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStaffWorkload } from '../../services/staffAssignmentService';
import { listStaff } from '../../services/staffService';
import type { StaffWorkload } from '../../types/staffAssignment.types';
import type { Staff } from '../../types/staff.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/format';

const StaffWorkloadPage = () => {
  const [workload, setWorkload] = useState<StaffWorkload[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    listStaff({ limit: 100 }).then((res) => setStaffList(res.data));
  }, []);

  const fetchWorkload = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getStaffWorkload({
        staffId: staffFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setWorkload(result);
    } finally {
      setIsLoading(false);
    }
  }, [staffFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  const totalLabour = workload.reduce((sum, w) => sum + w.totalLabourAmount, 0);
  const totalBags = workload.reduce((sum, w) => sum + w.totalBagsHandled, 0);

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link to="/staff-assignments" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Assignments
      </Link>

      <div className="mt-3">
        <PageHeader
          title="Staff Workload"
          subtitle="Bags handled and labour earned per staff member — a foundation for future per-staff labour reports and payment reconciliation."
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <SelectField label="Staff" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">All staff</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextField label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading workload..." />
        ) : workload.length === 0 ? (
          <EmptyState message="No assignments match these filters." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Staff</th>
                <th className="px-4 py-2 font-medium">Assignments</th>
                <th className="px-4 py-2 font-medium">Bags Handled</th>
                <th className="px-4 py-2 font-medium">Total Labour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workload.map((w) => (
                <tr key={w.staffId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {w.staffName}{' '}
                    <span className="text-gray-400 text-xs">({w.staffCode})</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{w.assignmentCount}</td>
                  <td className="px-4 py-3 text-gray-500">{w.totalBagsHandled}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(w.totalLabourAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold text-gray-700">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">
                  {workload.reduce((sum, w) => sum + w.assignmentCount, 0)}
                </td>
                <td className="px-4 py-3">{totalBags}</td>
                <td className="px-4 py-3">{formatCurrency(totalLabour)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffWorkloadPage;
