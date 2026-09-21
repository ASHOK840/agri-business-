interface StatusPillProps {
  status: 'ACTIVE' | 'INACTIVE';
}

const StatusPill = ({ status }: StatusPillProps) => {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${
        isActive
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-100 text-gray-500 border-gray-200'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

export default StatusPill;
