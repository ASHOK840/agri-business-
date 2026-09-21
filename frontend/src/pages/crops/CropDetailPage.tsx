import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCrop, updateCropStatus } from '../../services/cropService';
import { listCropPrices } from '../../services/cropPriceService';
import type { Crop } from '../../types/crop.types';
import type { CropPrice } from '../../types/cropPrice.types';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import FutureSectionCard from '../../components/common/FutureSectionCard';
import { formatDate, formatCurrency } from '../../utils/format';

const CropDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isOwner = user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [recentPrices, setRecentPrices] = useState<CropPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCrop(id)
      .then(setCrop)
      .finally(() => setIsLoading(false));
    listCropPrices({ cropId: id, limit: 5 }).then((res) => setRecentPrices(res.data));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!crop) return;
    const nextStatus = crop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsToggling(true);
    try {
      const updated = await updateCropStatus(crop.id, nextStatus);
      setCrop(updated);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading crop...</div>;
  }

  if (!crop) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-gray-500">
        Crop not found.{' '}
        <Link to="/crops" className="text-green-700 hover:underline">
          Back to crop list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link to="/crops" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Crops
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{crop.name}</h2>
          <p className="text-sm text-gray-500">{crop.cropCode}</p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-3">
            <StatusPill status={crop.status} />
            <Button variant="secondary" onClick={() => navigate(`/crops/${crop.id}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={handleToggleStatus} isLoading={isToggling}>
              {crop.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
        {!isOwner && <StatusPill status={crop.status} />}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        <div className="px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500">Default Bag Weight</span>
          <span className="text-gray-800 font-medium">
            {Number(crop.defaultBagWeightKg)} kg
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Recent Prices
        </h3>
        <Link
          to={`/crop-prices?cropId=${crop.id}`}
          className="text-sm text-green-700 hover:underline"
        >
          View full history →
        </Link>
      </div>

      {recentPrices.length === 0 ? (
        <p className="text-sm text-gray-400 mb-6">
          No prices recorded yet for this crop.{' '}
          <Link to="/crop-prices/new" className="text-green-700 hover:underline">
            Add one
          </Link>
        </p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
          {recentPrices.map((price) => (
            <div key={price.id} className="px-4 py-3 flex justify-between text-sm">
              <div>
                <span className="text-gray-800">{formatDate(price.effectiveDate)}</span>
                {price.buyer && (
                  <span className="text-gray-400"> · {price.buyer.companyName}</span>
                )}
              </div>
              <span className="text-gray-800 font-medium">
                {formatCurrency(price.pricePerKg)}/kg
              </span>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Coming Later
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FutureSectionCard
          title="Quality Standards"
          description="Quality grading criteria and price-adjustment rules for this crop will appear here."
        />
      </div>
    </div>
  );
};

export default CropDetailPage;
