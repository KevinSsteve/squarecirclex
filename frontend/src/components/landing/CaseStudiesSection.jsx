import PropTypes from 'prop-types';
import CaseStudyCard from './CaseStudyCard';
import SectionContainer from './SectionContainer';
import { colors, typography, spacing } from '../../styles/designSystem';

const CaseStudiesSection = () => {
  const caseStudies = [
    {
      id: 1,
      title: 'E-commerce de Moda',
      metrics: {
        engagement: {
          value: '+142%',
          label: 'Engagement',
        },
        growth: {
          value: '2.5X',
          label: 'Crescimento',
        },
      },
    },
    {
      id: 2,
      title: 'Restaurante Local',
      metrics: {
        reach: {
          value: '+116%',
          label: 'Alcance',
        },
        conversions: {
          value: '3.4X',
          label: 'Conversões',
        },
      },
    },
    {
      id: 3,
      title: 'Consultoria B2B',
      metrics: {
        leads: {
          value: '+127%',
          label: 'Leads',
        },
        roi: {
          value: '3.2X',
          label: 'ROI',
        },
      },
    },
  ];

  const styles = {
    header: {
      textAlign: 'center',
      marginBottom: spacing['3xl'],
    },
    title: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      marginBottom: spacing.md,
      lineHeight: typography.lineHeight.tight,
    },
    subtitle: {
      fontSize: typography.fontSize.lg,
      color: colors.gray[600],
      lineHeight: typography.lineHeight.relaxed,
      maxWidth: '600px',
      margin: '0 auto',
    },
    cardsContainer: {
      display: 'flex',
      gap: spacing.xl,
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: spacing.md,
    },
    card: {
      scrollSnapAlign: 'start',
    },
  };

  const mediaQueries = `
    @media (min-width: 768px) {
      .case-studies-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        overflow-x: visible;
      }
    }
  `;

  return (
    <>
      <style>{mediaQueries}</style>
      <SectionContainer backgroundColor={colors.white}>
        <div style={styles.header}>
          <h2 style={styles.title}>Resultados Comprovados</h2>
          <p style={styles.subtitle}>
            Casos de sucesso reais de clientes que transformaram a sua presença digital
          </p>
        </div>
        <div style={styles.cardsContainer} className="case-studies-cards">
          {caseStudies.map((caseStudy) => (
            <div key={caseStudy.id} style={styles.card}>
              <CaseStudyCard
                title={caseStudy.title}
                metrics={caseStudy.metrics}
              />
            </div>
          ))}
        </div>
      </SectionContainer>
    </>
  );
};

export default CaseStudiesSection;
