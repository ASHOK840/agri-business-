interface FutureSectionCardProps {
  title: string;
  description: string;
}

const FutureSectionCard = ({ title, description }: FutureSectionCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
      <span className="inline-block mt-3 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">
        Coming soon
      </span>
    </div>
  );
};

export default FutureSectionCard;
