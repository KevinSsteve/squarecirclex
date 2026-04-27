import PropTypes from 'prop-types';
import Button from './Button';

const PricingCard = ({ plan, isPopular, billingPeriod, onSelectPlan }) => {
  const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annual;
  const period = billingPeriod === 'monthly' ? '/mês' : '/ano';

  return (
    <div
      className={`relative bg-white border rounded-lg p-8 h-full flex flex-col transition-all duration-300 ${
        isPopular
          ? 'border-gray-900 shadow-xl scale-105'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gray-900 text-white text-xs font-semibold px-4 py-1 rounded-full">
            Mais Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600 ml-2">{period}</span>
        </div>
        {billingPeriod === 'annual' && (
          <p className="text-sm text-green-600 mt-2">
            Poupe {plan.savings || '2 meses'} com pagamento anual
          </p>
        )}
      </div>

      {/* Features List */}
      <div className="flex-1 mb-8">
        <ul className="space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg
                className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0"
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
              <span className="ml-3 text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <Button
        variant={isPopular ? 'primary' : 'secondary'}
        size="large"
        onClick={() => onSelectPlan(plan.name)}
        className="w-full"
      >
        Começar Agora
      </Button>
    </div>
  );
};

PricingCard.propTypes = {
  plan: PropTypes.shape({
    name: PropTypes.string.isRequired,
    price: PropTypes.shape({
      monthly: PropTypes.string.isRequired,
      annual: PropTypes.string.isRequired,
    }).isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    savings: PropTypes.string,
  }).isRequired,
  isPopular: PropTypes.bool,
  billingPeriod: PropTypes.oneOf(['monthly', 'annual']).isRequired,
  onSelectPlan: PropTypes.func.isRequired,
};

PricingCard.defaultProps = {
  isPopular: false,
};

export default PricingCard;
