import SectionContainer from './SectionContainer';
import ComparisonColumn from './ComparisonColumn';

const ComparisonSection = () => {
  const columns = [
    {
      title: 'Freelancers',
      points: [
        'Escopo flexível',
        'Capacidade limitada',
        'Foco em execução',
        'Relatórios informais',
        'Disponibilidade variável',
      ],
      highlighted: false,
    },
    {
      title: 'Agências Tradicionais',
      points: [
        'Equipas grandes',
        'Contratos longos',
        'Onboarding lento',
        'Serviços diversos',
        'Comunicação complexa',
      ],
      highlighted: false,
    },
    {
      title: 'Square Circle X',
      points: [
        'Escopo definido',
        'Entrega estruturada',
        'Workflows com IA',
        'Relatórios focados',
        'Otimização contínua',
      ],
      highlighted: true,
    },
  ];

  return (
    <SectionContainer background="gray">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Parceiro Certo para o Seu Crescimento
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Compare a nossa abordagem com outras opções do mercado
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {columns.map((column, index) => (
          <ComparisonColumn
            key={index}
            title={column.title}
            points={column.points}
            isHighlighted={column.highlighted}
          />
        ))}
      </div>

      {/* Additional Context */}
      <div className="text-center mt-12">
        <p className="text-sm text-gray-600 max-w-3xl mx-auto">
          A Square Circle X combina o melhor dos dois mundos: a agilidade de freelancers com a estrutura de agências,
          potenciada por IA avançada para resultados consistentes e escaláveis.
        </p>
      </div>
    </SectionContainer>
  );
};

export default ComparisonSection;
