import type { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

// Mirrors TextField so every dropdown in the app gets the same visual
// treatment AND a properly associated <label htmlFor>, which a plain
// <label> + <select> pair next to each other does not give you for
// free — screen readers and "click label to focus" both need the id
// link, not just visual proximity.
const SelectField = ({ label, error, hint, id, children, ...selectProps }: SelectFieldProps) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={fieldId}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-green-500/40 ${
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
        }`}
        {...selectProps}
      >
        {children}
      </select>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SelectField;
