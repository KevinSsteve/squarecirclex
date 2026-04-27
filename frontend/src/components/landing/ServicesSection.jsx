import ServiceCard from './ServiceCard';
import SectionContainer from './SectionContainer';
import { colors, typography, spacing, transitions } from '../../styles/designSystem';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const ServicesSection = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const services = [
    {
      number: '001',
      title: 'Criação de Conteúdo IA',
      description: 'Gere conteúdo profissional e envolvente com inteligência artificial avançada.',
      capabilities: [
        'Legendas profissionais otimizadas',
        'Hashtags relevantes e estratégicas',
        'Descrições envolventes e persuasivas',
        'Análise de tendências em tempo real',
      ],
    },
    {
      number: '002',
      title: 'Geração de Imagens',
      description: 'Crie imagens únicas e de alta qualidade com AWS Titan Image Generator.',
      capabilities: [
        'Imagens únicas geradas por IA',
        'Branding consistente e profissional',
        'Alta qualidade e resolução',
        'Personalização completa',
      ],
    },
    {
      number: '003',
      title: 'Planeamento Estratégico',
      description: 'Planeie sua estratégia de conteúdo com calendário inteligente e análise de audiência.',
      capabilities: [
        'Calendário de conteúdo inteligente',
        'Análise profunda de audiência',
        'Otimização de horários de publicação',
        'Planeamento semanal automatizado',
      ],
    },
    {
      number: '004',
      title: 'Análise e Insights',
      description: 'Acompanhe performance e obtenha insights acionáveis para melhorar resultados.',
      capabilities: [
        'Métricas de performance detalhadas',
        'Relatórios automáticos e visuais',
        'Insights acionáveis baseados em dados',
        'Tracking completo de KPIs',
      ],
    },
    {
      number: '005',
      title: 'Automação de Posts',
      description: 'Publique automaticamente em múltiplas plataformas com agendamento inteligente.',
      capabilities: [
        'Publicação automática multi-plataforma',
        'Agendamento inteligente otimizado',
        'Gestão centralizada de conteúdo',
        'Sincronização em tempo real',
      ],
    },
    {
      number: '006',
      title: 'Otimização Contínua',
      description: 'Melhore constantemente seus resultados com testes A/B e refinamento baseado em dados.',
      capabilities: [
        'Testes A/B automatizados',
        'Melhorias baseadas em dados reais',
        'Refinamento contínuo de estratégia',
        'Crescimento escalável e sustentável',
      ],
    },
  ];

  const styles = {
    section: {
      backgroundColor: colors.gray[50],
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: spacing.xl,
    },
  };

  const responsiveStyles = `
    .services-section {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity ${transitions.duration.slow} ${transitions.timing.easeOut},
                  transform ${transitions.duration.slow} ${transitions.timing.easeOut};
    }

    .services-section.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .service-card {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity ${transitions.duration.base} ${transitions.timing.easeOut},
                  transform ${transitions.duration.base} ${transitions.timing.easeOut};
    }

    .services-section.visible .service-card {
      opacity: 1;
      transform: translateY(0);
    }

    .services-section.visible .service-card:nth-child(1) { transition-delay: 0ms; }
    .services-section.visible .service-card:nth-child(2) { transition-delay: 100ms; }
    .services-section.visible .service-card:nth-child(3) { transition-delay: 200ms; }
    .services-section.visible .service-card:nth-child(4) { transition-delay: 300ms; }
    .services-section.visible .service-card:nth-child(5) { transition-delay: 400ms; }
    .services-section.visible .service-card:nth-child(6) { transition-delay: 500ms; }

    @media (max-width: 1024px) {
      .services-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
      }
      .services-title {
        font-size: ${typography.fontSize['3xl']};
      }
      .services-subtitle {
        font-size: ${typography.fontSize.lg};
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .services-section,
      .service-card {
        transition: none;
        opacity: 1;
        transform: none;
      }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={styles.section}>
        <SectionContainer>
          <div style={styles.header}>
            <h2 style={styles.title} className="services-title">
              Os Nossos Serviços
            </h2>
            <p style={styles.subtitle} className="services-subtitle">
              Seis pilares estruturados para transformar sua presença digital 
              e maximizar resultados nas redes sociais.
            </p>
          </div>
          <div 
            ref={sectionRef}
            style={styles.grid} 
            className={`services-grid services-section ${isVisible ? 'visible' : ''}`}
          >
            {services.map((service) => (
              <div key={service.number} className="service-card">
                <ServiceCard
                  number={service.number}
                  title={service.title}
                  description={service.description}
                  capabilities={service.capabilities}
                />
              </div>
            ))}
          </div>
        </SectionContainer>
      </div>
    </>
  );
};

export default ServicesSection;
