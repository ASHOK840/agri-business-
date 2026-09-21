import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFarmer, updateFarmerStatus } from '../../services/farmerService';
import type { Farmer } from '../../types/farmer.types';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import FutureSectionCard from '../../components/common/FutureSectionCard';

const FarmerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    getFarmer(id)
      .then(setFarmer)
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!farmer) return;
    const nextStatus = farmer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsToggling(true);
    try {
      const updated = await updateFarmerStatus(farmer.id, nextStatus);
      setFarmer(updated);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading farmer...</div>;
  }

  if (!farmer) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-gray-500">
        Farmer not found.{' '}
        <Link to="/farmers" className="text-green-700 hover:underline">
          Back to farmer list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link to="/farmers" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Farmers
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{farmer.name}</h2>
          <p className="text-sm text-gray-500">{farmer.farmerCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={farmer.status} />
          <Button variant="secondary" onClick={() => navigate(`/farmers/${farmer.id}/edit`)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={handleToggleStatus}
            isLoading={isToggling}
          >
            {farmer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        {[
          ['Phone', farmer.phone || '—'],
          ['Village', farmer.village || '—'],
          ['Address', farmer.address || '—'],
        ].map(([label, value]) => (
          <div key={label} className="px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-800 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Transaction History
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FutureSectionCard
          title="Purchase History"
          description="Crop purchases from this farmer will appear here once the Purchases module is built."
        />
        <FutureSectionCard
          title="Advance Payments"
          description="Advances given to this farmer will be tracked here."
        />
        <FutureSectionCard
          title="Final Payments"
          description="Settlement payments after sale and quality adjustment will appear here."
        />
        <FutureSectionCard
          title="Receipts"
          description="Printable receipts for this farmer's transactions will be generated here."
        />
      </div>
    </div>
  );
};

export default FarmerDetailPage;
