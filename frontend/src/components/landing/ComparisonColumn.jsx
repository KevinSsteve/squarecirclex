import PropTypes from 'prop-types';

const ComparisonColumn = ({ title, points, isHighlighted }) => {
  return (
    <div
      className={`relative rounded-lg p-8 h-full transition-all duration-300 ${
        isHighlighted
          ? 'bg-gray-900 text-white scale-105 shadow-2xl'
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      {/* Title */}
      <div className="mb-8">
        <h3
          className={`text-2xl font-bold ${
            isHighlighted ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </h3>
      </div>

      {/* Points List */}
      <ul className="space-y-4">
        {points.map((point, index) => (
          <li key={index} className="flex items-start">
            <svg
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isHighlighted ? 'text-white' : 'text-gray-900'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span
              className={`ml-3 text-sm ${
                isHighlighted ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

ComparisonColumn.propTypes = {
  title: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(PropTypes.string).isRequired,
  isHighlighted: PropTypes.bool,
};

ComparisonColumn.defaultProps = {
  isHighlighted: false,
};

export default ComparisonColumn;
