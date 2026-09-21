import { useEffect, useRef, useState } from 'react';
import { listFarmers } from '../../services/farmerService';
import type { Farmer } from '../../types/farmer.types';

interface FarmerSearchSelectProps {
  value: string;
  onChange: (farmerId: string) => void;
  label?: string;
}

// A typeahead lookup for the farmer filter, in place of a plain <select>
// listing every farmer. With hundreds/thousands of farmers, scrolling a
// dropdown to find one is impractical — especially when a farmer walks in
// without their phone number handy. Staff can instead type a partial name,
// phone number, or the farmer ID printed on their purchase bill.
const FarmerSearchSelect = ({ value, onChange, label = 'Farmer' }: FarmerSearchSelectProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) {
      setSelectedFarmer(null);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      listFarmers({ search: query.trim() || undefined, limit: 10 }).then((res) => setResults(res.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelect = (farmer: Farmer) => {
    onChange(farmer.id);
    setSelectedFarmer(farmer);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSelectedFarmer(null);
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      {selectedFarmer ? (
        <div className="flex items-center justify-between border border-gray-300 rounded-md pl-3 pr-1.5 py-1.5 text-sm bg-gray-50">
          <span className="truncate text-gray-800">
            {selectedFarmer.name}
            <span className="text-gray-400"> · {selectedFarmer.farmerCode}</span>
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 px-1.5"
            aria-label="Clear farmer filter"
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search name, phone or farmer ID"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
      )}
      {isOpen && !selectedFarmer && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No farmers found</div>
          ) : (
            results.map((farmer) => (
              <button
                key={farmer.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 flex flex-col"
                onClick={() => handleSelect(farmer)}
              >
                <span className="text-gray-800 font-medium">{farmer.name}</span>
                <span className="text-gray-400 text-xs">
                  {farmer.farmerCode}
                  {farmer.phone ? ` · ${farmer.phone}` : ''}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FarmerSearchSelect;
