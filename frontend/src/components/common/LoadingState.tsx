interface LoadingStateProps {
  label?: string;
}

// One consistent "loading" look everywhere a page or panel is waiting
// on data — a small spinner plus a short label, never a bare blinking
// "Loading..." line in a different style on every page.
const LoadingState = ({ label = 'Loading...' }: LoadingStateProps) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
    {label}
  </div>
);

export default LoadingState;
