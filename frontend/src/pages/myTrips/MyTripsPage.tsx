import { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';
import { IconTruck } from '../../components/common/icons';
import { listMyTransportRecords, updateTransportStatus } from '../../services/transportRecordService';
import type { TransportRecord } from '../../types/transportRecord.types';

// Plain-language status label instead of the technical enum value — the
// Transportation role must never need to decode "PENDING"/"IN_TRANSIT".
const statusLabel: Record<TransportRecord['status'], string> = {
  PENDING: 'Waiting to start',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const statusPillStyles: Record<TransportRecord['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

// The entire Transportation workflow: see your own assigned trips, start
// one, mark it delivered. No accounting, no other business modules.
const MyTripsPage = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TransportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTrips = () => {
    setIsLoading(true);
    listMyTransportRecords()
      .then(setTrips)
      .catch(() => setError('Could not load your trips.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleAction = async (trip: TransportRecord, nextStatus: 'IN_TRANSIT' | 'DELIVERED') => {
    setError('');
    setUpdatingId(trip.id);
    try {
      await updateTransportStatus(trip.id, nextStatus);
      loadTrips();
    } catch {
      setError('Could not update this trip. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <p className="text-lg text-gray-600 mb-1">
        Hello, <span className="font-semibold text-gray-800">{user?.name || 'Driver'}</span>
      </p>
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Trips</h2>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-14 text-center">
          <IconTruck className="h-12 w-12 text-gray-300" />
          <p className="text-base font-semibold text-gray-700">No trips assigned</p>
          <p className="text-sm text-gray-400 max-w-xs">
            You don't have any transportation trips right now. When the owner assigns a trip, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trips.map((trip) => (
            <div key={trip.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <IconTruck className="h-4 w-4" />
                  Trip
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusPillStyles[trip.status]}`}>
                  {statusLabel[trip.status]}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-gray-700 mb-3">
                {trip.purchase && <p><span className="text-gray-400">Farmer trip:</span> {trip.purchase.purchaseNumber}</p>}
                {trip.buyer && <p><span className="text-gray-400">Buyer:</span> {trip.buyer.companyName}</p>}
                <p><span className="text-gray-400">Pickup:</span> {trip.fromLocation}</p>
                <p><span className="text-gray-400">Destination:</span> {trip.toLocation}</p>
                <p><span className="text-gray-400">Crop:</span> {trip.crop.name}</p>
                {trip.weightKg && <p><span className="text-gray-400">Quantity:</span> {trip.weightKg} kg</p>}
                {trip.numberOfBags && <p><span className="text-gray-400">Bags:</span> {trip.numberOfBags}</p>}
              </div>

              {trip.status === 'PENDING' && (
                <Button
                  className="w-full py-3 text-base"
                  isLoading={updatingId === trip.id}
                  onClick={() => handleAction(trip, 'IN_TRANSIT')}
                >
                  Start Trip
                </Button>
              )}
              {trip.status === 'IN_TRANSIT' && (
                <Button
                  className="w-full py-3 text-base"
                  isLoading={updatingId === trip.id}
                  onClick={() => handleAction(trip, 'DELIVERED')}
                >
                  Mark Delivered
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTripsPage;
