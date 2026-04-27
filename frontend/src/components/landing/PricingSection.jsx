import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionContainer from './SectionContainer';
import PricingCard from './PricingCard';

const PricingSection = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Starter',
      price: {
        monthly: '€49',
        annual: '€490',
      },
      savings: '2 meses',
      features: [
        '10 posts por mês',
        'Geração de imagens IA',
        'Calendário de conteúdo',
        'Análise básica',
        'Suporte por email',
      ],
    },
    {
      name: 'Growth',
      price: {
        monthly: '€99',
        annual: '€990',
      },
      savings: '2 meses',
      features: [
        'Posts ilimitados',
        'Geração avançada de imagens',
        'Planeamento estratégico',
        'Análise completa',
        'Automação de publicação',
        'Multi-plataforma',
        'Suporte prioritário',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: {
        monthly: '€249',
        annual: '€2490',
      },
      savings: '2 meses',
      features: [
        'Tudo do Growth',
        'Estratégia personalizada',
        'Consultoria mensal',
        'API access',
        'White-label',
        'Gestor de conta dedicado',
        'SLA garantido',
      ],
    },
  ];

  const handleSelectPlan = (planName) => {
    // Navigate to signup with plan pre-selected
    navigate(`/signup?plan=${planName.toLowerCase()}&billing=${billingPeriod}`);
  };

  return (
    <SectionContainer background="white" id="pricing">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Planos Flexíveis
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Para cada fase do seu crescimento
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="ml-2 text-xs text-green-600 font-semibold">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            isPopular={plan.popular}
            billingPeriod={billingPeriod}
            onSelectPlan={handleSelectPlan}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="text-center mt-12">
        <p className="text-sm text-gray-600">
          Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito necessário.
        </p>
      </div>
    </SectionContainer>
  );
};

export default PricingSection;
