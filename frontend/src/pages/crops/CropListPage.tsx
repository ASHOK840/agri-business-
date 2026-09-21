import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listCrops, updateCropStatus } from '../../services/cropService';
import type { Crop, CropStatus } from '../../types/crop.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatWeight } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const CropListPage = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [statusFilter, setStatusFilter] = useState<CropStatus | ''>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCrops = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listCrops({
        limit: 100,
        search: searchRef.current || undefined,
        // Staff can only ever see active crops — the backend enforces
        // this regardless, but there's no point offering the filter
        // control to a role that can't use it.
        status: isOwner ? statusFilter || undefined : 'ACTIVE',
      });
      setCrops(result.data);
    } finally {
      setIsLoading(false);
    }
  }, [searchTrigger, statusFilter, isOwner]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const handleToggleStatus = async (crop: Crop) => {
    const nextStatus: CropStatus = crop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(crop.id);
    try {
      await updateCropStatus(crop.id, nextStatus);
      setCrops((prev) => prev.map((c) => (c.id === crop.id ? { ...c, status: nextStatus } : c)));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <PageHeader
        title="Crops"
        action={isOwner ? <Button variant="secondary" onClick={() => navigate('/crops/new')}>+ Add Crop</Button> : undefined}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchField
            placeholder="Search by crop name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        {isOwner && (
          <div className="sm:w-48">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CropStatus | '')}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </SelectField>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading crops..." />
        ) : crops.length === 0 ? (
          <EmptyState
            message="No crops found."
            action={
              isOwner ? (
                <Link to="/crops/new" className="text-green-700 hover:underline text-sm">
                  Add your first crop
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Crop Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Default Bag Weight</th>
                <th className="px-4 py-2 font-medium">Status</th>
                {isOwner && <th className="px-4 py-2 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {crops.map((crop) => (
                <tr key={crop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/crops/${crop.id}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {crop.cropCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{crop.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatWeight(crop.defaultBagWeightKg)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={crop.status} />
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/crops/${crop.id}/edit`}
                        className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(crop)}
                        disabled={togglingId === crop.id}
                        className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                      >
                        {crop.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
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

export default CropListPage;
