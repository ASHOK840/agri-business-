import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCurrentStock } from '../../services/inventoryService';
import type { CropStock } from '../../types/inventory.types';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatWeight } from '../../utils/format';

const InventoryPage = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const [stock, setStock] = useState<CropStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentStock({})
      .then(setStock)
      .finally(() => setIsLoading(false));
  }, []);

  const lowStockCrops = stock.filter((s) => s.isLowStock);

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <PageHeader
        title="Current Inventory"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/inventory/movements')}>
              Movement History
            </Button>
            <Button variant="secondary" onClick={() => navigate('/inventory/dispatch')}>
              + Dispatch Stock
            </Button>
            {isOwner && (
              <Button variant="secondary" onClick={() => navigate('/inventory/adjustments')}>+ Adjustment</Button>
            )}
          </div>
        }
      />

      <p className="text-sm text-gray-500 mb-6">
        Current stock is always calculated from movement history — total
        stock received in, minus total dispatched out, plus any
        authorized adjustments. It is never a number you can type over
        directly.
      </p>

      {lowStockCrops.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          <p className="text-sm text-amber-800 font-medium">
            ⚠ Low stock: {lowStockCrops.map((c) => c.cropName).join(', ')}
          </p>
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading inventory..." />
      ) : stock.length === 0 ? (
        <EmptyState message="No active crops configured yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stock.map((s) => (
            <div
              key={s.cropId}
              className={`bg-white rounded-lg border p-4 ${
                s.isLowStock ? 'border-amber-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{s.cropName}</h3>
                  <p className="text-xs text-gray-400">{s.cropCode}</p>
                </div>
                {s.isLowStock && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Low Stock
                  </span>
                )}
              </div>

              <div className="mb-3">
                <p className="text-2xl font-semibold text-gray-800">
                  {formatWeight(s.currentStockKg)}
                </p>
                <p className="text-sm text-gray-500">{s.currentStockBags} bags</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div>
                  <span className="block text-gray-400">In</span>
                  <span className="text-gray-700 font-medium">
                    {formatWeight(s.totalInKg)}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400">Out</span>
                  <span className="text-gray-700 font-medium">
                    {formatWeight(s.totalOutKg)}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400">Adjustments</span>
                  <span className="text-gray-700 font-medium">
                    {s.totalAdjustmentKg > 0 ? '+' : ''}
                    {formatWeight(s.totalAdjustmentKg)}
                  </span>
                </div>
              </div>

              {s.lowStockThresholdKg !== null && (
                <p className="text-xs text-gray-400 mt-2">
                  Low stock threshold: {formatWeight(s.lowStockThresholdKg)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
