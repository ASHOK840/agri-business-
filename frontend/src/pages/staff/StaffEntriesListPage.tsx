import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { IconLeaf } from '../../components/common/icons';
import { listMyStaffEntries } from '../../services/staffEntryService';
import type { StaffEntry } from '../../types/staffEntry.types';

// A narrow, read-only list of what this Staff user has already entered —
// no rate, no amount, no accounting figures, matching the /staff-entries
// API's own narrow response shape.
const StaffEntriesListPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<StaffEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listMyStaffEntries(50)
      .then(setEntries)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Entries</h2>

      {isLoading ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <EmptyState message="No entries yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <IconLeaf className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-800">{entry.farmerName}</p>
                {entry.village && <p className="text-sm text-gray-500">{entry.village}</p>}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span>Crop: {entry.cropName}</span>
                  <span>{entry.quantityKg ?? '—'} kg</span>
                  <span>{entry.numberOfBags ?? '—'} bags</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-full mt-6" onClick={() => navigate('/staff')}>
        Back
      </Button>
    </div>
  );
};

export default StaffEntriesListPage;
