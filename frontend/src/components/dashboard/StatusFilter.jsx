const StatusFilter = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { value: 'all', label: 'All Posts', color: 'gray' },
    { value: 'Draft', label: 'Draft', color: 'yellow' },
    { value: 'Scheduled', label: 'Scheduled', color: 'blue' },
    { value: 'Published', label: 'Published', color: 'green' },
    { value: 'Failed', label: 'Failed', color: 'red' },
  ];

  const getButtonClasses = (filter) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
    
    if (currentFilter === filter.value) {
      const activeColors = {
        gray: 'bg-gray-600 text-white',
        yellow: 'bg-yellow-500 text-white',
        blue: 'bg-blue-600 text-white',
        green: 'bg-green-600 text-white',
        red: 'bg-red-600 text-white',
      };
      return `${baseClasses} ${activeColors[filter.color]}`;
    }
    
    return `${baseClasses} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={getButtonClasses(filter)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StatusFilter;
