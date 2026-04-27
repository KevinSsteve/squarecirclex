import { useState } from 'react';
import PropTypes from 'prop-types';

const FAQItem = ({ number, question, answer, isOpen, onToggle }) => {
  const contentId = `faq-content-${number}`;
  const buttonId = `faq-button-${number}`;

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        id={buttonId}
        onClick={onToggle}
        className="w-full py-6 flex items-start justify-between text-left hover:bg-gray-50 transition-colors px-4 -mx-4 rounded-lg"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="flex-1 pr-8">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-sm font-medium text-gray-400 select-none" aria-hidden="true">{number}</span>
            <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
          </div>
        </div>
        <div className="flex-shrink-0 mt-1" aria-hidden="true">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="pb-6 pl-4 pr-4">
          <div className="pl-12">
            <p className="text-gray-600 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

FAQItem.propTypes = {
  number: PropTypes.string.isRequired,
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default FAQItem;
