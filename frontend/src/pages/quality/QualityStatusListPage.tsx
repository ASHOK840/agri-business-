import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listQualityStatuses,
  updateQualityStatusStatus,
} from '../../services/qualityStatusService';
import type { QualityStatus } from '../../types/qualityStatus.types';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';

const QualityStatusListPage = () => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<QualityStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStatuses = () => {
    setIsLoading(true);
    listQualityStatuses({ limit: 100 })
      .then((res) => setStatuses(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchStatuses, []);

  const handleToggleStatus = async (qs: QualityStatus) => {
    const nextStatus = qs.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(qs.id);
    try {
      await updateQualityStatusStatus(qs.id, nextStatus);
      setStatuses((prev) => prev.map((s) => (s.id === qs.id ? { ...s, status: nextStatus } : s)));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <PageHeader
        title="Quality Statuses"
        action={<Button variant="secondary" onClick={() => navigate('/quality-statuses/new')}>+ Add Status</Button>}
      />

      <p className="text-sm text-gray-500 mb-6">
        These are the quality grades staff can choose from when recording
        a crop's quality. Add, rename, or deactivate them here — no code
        change needed. Mark a status as "Rejection" if choosing it should
        require a written reason.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No quality statuses configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Rejection?</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.map((qs) => (
                <tr key={qs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{qs.code}</td>
                  <td className="px-4 py-3 text-gray-800">{qs.name}</td>
                  <td className="px-4 py-3">
                    {qs.isRejection ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        Requires reason
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={qs.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/quality-statuses/${qs.id}/edit`)}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(qs)}
                      disabled={togglingId === qs.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {qs.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityStatusListPage;
