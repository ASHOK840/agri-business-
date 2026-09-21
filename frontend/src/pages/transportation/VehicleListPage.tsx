import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleApi } from '../../services/transportMasterService';
import type { Vehicle, MasterStatus } from '../../types/transportMaster.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import StatusPill from '../../components/common/StatusPill';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

const VehicleListPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [statusFilter, setStatusFilter] = useState<MasterStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await vehicleApi.list({
        page,
        limit: 10,
        search: searchRef.current || undefined,
        status: statusFilter || undefined,
      });
      setVehicles(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, statusFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, statusFilter]);

  const handleToggleStatus = async (vehicle: Vehicle) => {
    const nextStatus: MasterStatus = vehicle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(vehicle.id);
    try {
      await vehicleApi.updateStatus(vehicle.id, nextStatus);
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicle.id ? { ...v, status: nextStatus } : v))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <PageHeader
        title="Vehicles"
        action={<Button variant="secondary" onClick={() => navigate('/vehicles/new')}>+ Add Vehicle</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchField
            placeholder="Search by vehicle number or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <div className="sm:w-48">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MasterStatus | '')}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading vehicles..." />
        ) : vehicles.length === 0 ? (
          <EmptyState message="No vehicles found." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Vehicle Number</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{vehicle.vehicleNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{vehicle.vehicleType || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={vehicle.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(vehicle)}
                      disabled={togglingId === vehicle.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {vehicle.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default VehicleListPage;
