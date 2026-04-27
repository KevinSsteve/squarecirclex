import PropTypes from 'prop-types';

const TestimonialCard = ({ quote, author, role, date }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 h-full flex flex-col">
      {/* Quote */}
      <div className="flex-1 mb-6">
        <p className="text-gray-700 text-base leading-relaxed">
          "{quote}"
        </p>
      </div>

      {/* Author Info */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{author}</p>
            <p className="text-gray-500 text-xs mt-1">{role}</p>
          </div>
          <div className="text-xs text-gray-400">
            {date}
          </div>
        </div>
      </div>
    </div>
  );
};

TestimonialCard.propTypes = {
  quote: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

export default TestimonialCard;
