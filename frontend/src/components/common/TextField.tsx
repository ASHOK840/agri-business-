import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const TextField = ({ label, error, hint, id, ...inputProps }: TextFieldProps) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={fieldId}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-green-500/40 ${
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
        }`}
        {...inputProps}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TextField;
