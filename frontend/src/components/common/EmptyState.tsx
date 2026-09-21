import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

// One consistent "nothing here yet" look for every empty table/list in
// the app, with room for an optional call-to-action (e.g. a link to
// create the first record).
const EmptyState = ({ message, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-gray-400">
    <p>{message}</p>
    {action}
  </div>
);

export default EmptyState;
