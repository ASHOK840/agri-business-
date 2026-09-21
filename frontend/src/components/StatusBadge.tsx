interface StatusBadgeProps {
  status: 'checking' | 'online' | 'offline';
}

const styles: Record<StatusBadgeProps['status'], string> = {
  checking: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  online: 'bg-green-100 text-green-800 border-green-300',
  offline: 'bg-red-100 text-red-800 border-red-300',
};

const labels: Record<StatusBadgeProps['status'], string> = {
  checking: 'Checking backend...',
  online: 'Backend connected',
  offline: 'Backend not reachable',
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-block text-sm font-medium px-3 py-1 rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
