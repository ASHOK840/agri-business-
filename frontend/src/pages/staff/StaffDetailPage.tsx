import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStaff, updateStaffStatus } from '../../services/staffService';
import type { Staff } from '../../types/staff.types';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import FutureSectionCard from '../../components/common/FutureSectionCard';

const StaffDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    getStaff(id)
      .then(setMember)
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!member) return;
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsToggling(true);
    try {
      const updated = await updateStaffStatus(member.id, nextStatus);
      setMember(updated);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading staff member...</div>;
  }

  if (!member) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-gray-500">
        Staff member not found.{' '}
        <Link to="/staff" className="text-green-700 hover:underline">
          Back to staff list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link to="/staff" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Staff
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{member.name}</h2>
          <p className="text-sm text-gray-500">{member.staffCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={member.status} />
          <Button variant="secondary" onClick={() => navigate(`/staff/${member.id}/edit`)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={handleToggleStatus} isLoading={isToggling}>
            {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        <div className="px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500">Phone</span>
          <span className="text-gray-800 font-medium">{member.phone || '—'}</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Coming Later
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FutureSectionCard
          title="Job Assignments"
          description="Purchases and tasks assigned to this staff member will appear here."
        />
        <FutureSectionCard
          title="Bags Handled"
          description="A running count of bags this staff member has processed will be tracked here."
        />
        <FutureSectionCard
          title="Labour Rate"
          description="This staff member's per-bag labour rate will be configurable here."
        />
        <FutureSectionCard
          title="Labour Earnings"
          description="Calculated earnings based on bags handled and labour rate will appear here."
        />
      </div>
    </div>
  );
};

export default StaffDetailPage;
