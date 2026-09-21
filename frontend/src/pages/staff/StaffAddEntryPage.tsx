import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import { listFarmers } from '../../services/farmerService';
import { listCrops } from '../../services/cropService';
import { createStaffEntry } from '../../services/staffEntryService';
import type { Farmer } from '../../types/farmer.types';
import type { Crop } from '../../types/crop.types';

// The entire simplified Staff workflow: pick or add a farmer, pick a
// crop, enter quantity + bags, save. Everything else (purchase rate,
// weighing math, inventory stock-in) happens automatically on the
// backend — see staffEntry.service.ts.
const StaffAddEntryPage = () => {
  const navigate = useNavigate();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(true);

  const [farmerMode, setFarmerMode] = useState<'search' | 'new'>('search');
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerResults, setFarmerResults] = useState<Farmer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  const [newFarmerName, setNewFarmerName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');

  const [cropId, setCropId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [numberOfBags, setNumberOfBags] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    listCrops({ status: 'ACTIVE', limit: 100 })
      .then((result) => setCrops(result.data))
      .finally(() => setIsLoadingCrops(false));
  }, []);

  const handleSearchFarmer = async () => {
    if (!farmerSearch.trim()) return;
    setIsSearching(true);
    setSelectedFarmer(null);
    try {
      const result = await listFarmers({ search: farmerSearch.trim(), status: 'ACTIVE', limit: 10 });
      setFarmerResults(result.data);
    } finally {
      setIsSearching(false);
    }
  };

  const resetFarmerSelection = () => {
    setSelectedFarmer(null);
    setFarmerResults([]);
    setFarmerSearch('');
    setNewFarmerName('');
    setVillage('');
    setPhone('');
  };

  const switchMode = (mode: 'search' | 'new') => {
    resetFarmerSelection();
    setFarmerMode(mode);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSavedMessage('');

    if (farmerMode === 'search' && !selectedFarmer) {
      setError('Please select a farmer, or switch to "New Farmer".');
      return;
    }
    if (farmerMode === 'new' && newFarmerName.trim().length < 2) {
      setError('Please enter the farmer name.');
      return;
    }
    if (!cropId) {
      setError('Please select a crop.');
      return;
    }
    if (!quantityKg || Number(quantityKg) <= 0) {
      setError('Please enter the quantity.');
      return;
    }
    if (!numberOfBags || Number(numberOfBags) <= 0) {
      setError('Please enter the number of bags.');
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = await createStaffEntry({
        ...(farmerMode === 'search'
          ? { farmerId: selectedFarmer!.id }
          : { farmerName: newFarmerName.trim(), village: village.trim(), phone: phone.trim() }),
        cropId,
        quantityKg,
        numberOfBags,
      });
      setSavedMessage(`Saved! Entry for ${entry.farmerName} — ${entry.cropName}, ${entry.quantityKg} kg, ${entry.numberOfBags} bags.`);
      resetFarmerSelection();
      setFarmerMode('search');
      setCropId('');
      setQuantityKg('');
      setNumberOfBags('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not save this entry. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Add Farmer Entry</h2>

      {savedMessage && (
        <div className="mb-4">
          <Alert type="success" message={savedMessage} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <Alert type="error" message={error} />}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => switchMode('search')}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                farmerMode === 'search' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Find Farmer
            </button>
            <button
              type="button"
              onClick={() => switchMode('new')}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                farmerMode === 'new' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              New Farmer
            </button>
          </div>

          {farmerMode === 'search' ? (
            selectedFarmer ? (
              <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedFarmer.name}</p>
                  <p className="text-xs text-gray-500">{selectedFarmer.village || 'No village on file'}</p>
                </div>
                <button
                  type="button"
                  onClick={resetFarmerSelection}
                  className="text-xs text-gray-500 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    placeholder="Type farmer name"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-600"
                  />
                  <Button type="button" onClick={handleSearchFarmer} isLoading={isSearching}>
                    Search
                  </Button>
                </div>
                {farmerResults.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {farmerResults.map((farmer) => (
                      <button
                        key={farmer.id}
                        type="button"
                        onClick={() => setSelectedFarmer(farmer)}
                        className="text-left rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-800">{farmer.name}</span>
                        {farmer.village && <span className="text-gray-400"> — {farmer.village}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {!isSearching && farmerResults.length === 0 && farmerSearch && (
                  <p className="text-xs text-gray-400">
                    No farmer found. Try "New Farmer" instead.
                  </p>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <TextField
                label="Farmer Name"
                value={newFarmerName}
                onChange={(e) => setNewFarmerName(e.target.value)}
                required
              />
              <TextField
                label="Address / Village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
              <TextField
                label="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}
        </div>

        {isLoadingCrops ? (
          <LoadingState label="Loading crops..." />
        ) : (
          <SelectField
            label="Crop"
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            required
          >
            <option value="">Select Crop</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </SelectField>
        )}

        <TextField
          label="Quantity (kg)"
          type="number"
          min="0"
          step="0.01"
          value={quantityKg}
          onChange={(e) => setQuantityKg(e.target.value)}
          required
        />

        <TextField
          label="Number of Bags"
          type="number"
          min="1"
          step="1"
          value={numberOfBags}
          onChange={(e) => setNumberOfBags(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3 text-base">
          Save Entry
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/staff')} className="w-full">
          Cancel
        </Button>
      </form>
    </div>
  );
};

export default StaffAddEntryPage;
