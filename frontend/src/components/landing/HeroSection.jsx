import { Link } from 'react-router-dom';
import Badge from './Badge';
import Button from './Button';
import SectionContainer from './SectionContainer';
import { typography, spacing, colors } from '../../styles/designSystem';

const HeroSection = () => {
  const styles = {
    container: {
      textAlign: 'center',
      maxWidth: '56rem', // 896px
      margin: '0 auto',
      paddingTop: spacing['2xl'],
      paddingBottom: spacing['2xl'],
    },
    badgeWrapper: {
      marginBottom: spacing.xl,
    },
    headline: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      lineHeight: typography.lineHeight.tight,
      marginBottom: spacing.lg,
      fontFamily: typography.fontFamily.sans,
    },
    subheadline: {
      fontSize: typography.fontSize.xl,
      color: colors.gray[600],
      lineHeight: typography.lineHeight.relaxed,
      marginBottom: spacing['3xl'],
      maxWidth: '42rem', // 672px
      margin: `0 auto ${spacing['3xl']} auto`,
    },
    ctaContainer: {
      display: 'flex',
      gap: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
  };

  // Mobile responsive styles
  const mobileStyles = `
    @media (max-width: 768px) {
      .hero-headline {
        font-size: ${typography.fontSize['4xl']};
      }
      .hero-subheadline {
        font-size: ${typography.fontSize.lg};
      }
      .hero-cta-container {
        flex-direction: column;
        width: 100%;
      }
      .hero-cta-container > * {
        width: 100%;
      }
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <SectionContainer>
        <div style={styles.container}>
          {/* Badge */}
          <div style={styles.badgeWrapper}>
            <Badge variant="default" size="md">
              ✨ Powered by AI & AWS
            </Badge>
          </div>

          {/* Headline */}
          <h1 style={styles.headline} className="hero-headline">
            Gestão de Redes Sociais
            <br />
            Inteligente e Automática
          </h1>

          {/* Subheadline */}
          <p style={styles.subheadline} className="hero-subheadline">
            Crie conteúdo profissional, gere imagens únicas e planeie estratégias 
            com IA avançada. Tudo numa plataforma simples e poderosa.
          </p>

          {/* CTAs */}
          <div style={styles.ctaContainer} className="hero-cta-container">
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Começar Gratuitamente
              </Button>
            </Link>
            <a href="#pricing" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                Ver Preços
              </Button>
            </a>
          </div>
        </div>
      </SectionContainer>
    </>
  );
};

export default HeroSection;
