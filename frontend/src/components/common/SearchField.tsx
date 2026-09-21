import type { InputHTMLAttributes } from 'react';
import Button from './Button';

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string;
  onSearch: () => void;
  isSearching?: boolean;
}

// A search box that both auto-searches as you type (unchanged — that
// wiring lives in the parent page via useSearchTrigger) AND has a
// visible Search button, so it's never ambiguous that typing does
// something. Wrapping it in a <form> means pressing Enter searches too,
// without any extra keyboard handling.
const SearchField = ({ label = 'Search', onSearch, isSearching, ...inputProps }: SearchFieldProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor="search-field" className="text-sm font-medium text-gray-700">
      {label}
    </label>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      className="flex gap-2"
    >
      <input
        id="search-field"
        type="search"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-green-500/40 focus:border-green-600"
        {...inputProps}
      />
      <Button type="submit" variant="secondary" isLoading={isSearching} className="shrink-0">
        Search
      </Button>
    </form>
  </div>
);

export default SearchField;
