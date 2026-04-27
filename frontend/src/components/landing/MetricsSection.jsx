import React from 'react';
import SectionContainer from './SectionContainer';
import MetricCard from './MetricCard';
import designSystem from '../../styles/designSystem';

const MetricsSection = () => {
  const metrics = [
    {
      number: '001',
      value: '142%',
      label: 'Crescimento Médio'
    },
    {
      number: '002',
      value: '3.2X',
      label: 'ROI Médio'
    },
    {
      number: '003',
      value: '89%',
      label: 'Taxa de Satisfação'
    },
    {
      number: '004',
      value: '2.5X',
      label: 'Aumento de Engagement'
    },
    {
      number: '005',
      value: '94%',
      label: 'Taxa de Retenção'
    },
    {
      number: '006',
      value: '500+',
      label: 'Clientes Ativos'
    }
  ];

  return (
    <SectionContainer backgroundColor={designSystem.colors.white}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: designSystem.spacing['2xl'] }}>
        <h2
          style={{
            fontSize: designSystem.typography.sizes['3xl'],
            fontWeight: designSystem.typography.weights.bold,
            color: designSystem.colors.black,
            marginBottom: designSystem.spacing.md,
            [`@media (min-width: ${designSystem.breakpoints.md})`]: {
              fontSize: designSystem.typography.sizes['4xl']
            }
          }}
        >
          As Nossas Métricas
        </h2>
        <p
          style={{
            fontSize: designSystem.typography.sizes.lg,
            color: designSystem.colors.gray[600],
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          Resultados comprovados que impulsionam o crescimento dos nossos clientes
        </p>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: designSystem.spacing.lg,
          [`@media (min-width: ${designSystem.breakpoints.sm})`]: {
            gridTemplateColumns: 'repeat(2, 1fr)'
          },
          [`@media (min-width: ${designSystem.breakpoints.lg})`]: {
            gridTemplateColumns: 'repeat(3, 1fr)'
          }
        }}
        className="metrics-grid"
      >
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.number}
            number={metric.number}
            value={metric.value}
            label={metric.label}
            delay={index * 100}
          />
        ))}
      </div>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: ${designSystem.spacing.lg};
        }

        @media (min-width: ${designSystem.breakpoints.sm}) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: ${designSystem.breakpoints.lg}) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </SectionContainer>
  );
};

export default MetricsSection;
