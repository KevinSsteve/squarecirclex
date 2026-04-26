import ProcessStep from './ProcessStep';
import SectionContainer from './SectionContainer';
import Button from './Button';
import { colors, typography, spacing } from '../../styles/designSystem';

const ProcessSection = () => {
  const steps = [
    {
      number: '001',
      title: 'Análise',
      description: 'Analisamos sua marca, audiência e objetivos para definir a estratégia ideal.',
    },
    {
      number: '002',
      title: 'Estratégia',
      description: 'Criamos um roadmap claro com prioridades e milestones definidos.',
    },
    {
      number: '003',
      title: 'Execução',
      description: 'Implementamos automações e geramos conteúdo consistente e profissional.',
    },
    {
      number: '004',
      title: 'Otimização',
      description: 'Monitorizamos performance e refinamos continuamente para maximizar resultados.',
    },
  ];

  const styles = {
    section: {
      backgroundColor: colors.white,
    },
    header: {
      textAlign: 'center',
      marginBottom: spacing['4xl'],
      maxWidth: '48rem',
      margin: `0 auto ${spacing['4xl']} auto`,
    },
    title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      marginBottom: spacing.lg,
      lineHeight: typography.lineHeight.tight,
    },
    subtitle: {
      fontSize: typography.fontSize.xl,
      color: colors.gray[600],
      lineHeight: typography.lineHeight.relaxed,
    },
    stepsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.xl,
      marginBottom: spacing['4xl'],
      position: 'relative',
    },
    ctaContainer: {
      textAlign: 'center',
    },
  };

  const responsiveStyles = `
    @media (max-width: 768px) {
      .process-steps-container {
        flex-direction: column;
        align-items: center;
      }
      .process-title {
        font-size: ${typography.fontSize['3xl']};
      }
      .process-subtitle {
        font-size: ${typography.fontSize.lg};
      }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={styles.section}>
        <SectionContainer>
          <div style={styles.header}>
            <h2 style={styles.title} className="process-title">
              Como Funciona
            </h2>
            <p style={styles.subtitle} className="process-subtitle">
              Framework claro e repetível para transformar sua presença digital 
              em resultados mensuráveis.
            </p>
          </div>
          
          <div style={styles.stepsContainer} className="process-steps-container">
            {steps.map((step, index) => (
              <ProcessStep
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>

          <div style={styles.ctaContainer}>
            <a href="#pricing" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Ver Preços
              </Button>
            </a>
          </div>
        </SectionContainer>
      </div>
    </>
  );
};

export default ProcessSection;
