import PropTypes from 'prop-types';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/designSystem';

const ServiceCard = ({ number, title, description, capabilities }) => {
  const styles = {
    card: {
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: borderRadius.xl,
      padding: spacing['2xl'],
      transition: 'all 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    number: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray[400],
      letterSpacing: '0.05em',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      marginBottom: spacing.md,
      lineHeight: typography.lineHeight.tight,
    },
    description: {
      fontSize: typography.fontSize.base,
      color: colors.gray[600],
      lineHeight: typography.lineHeight.relaxed,
      marginBottom: spacing.xl,
    },
    capabilitiesList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      marginTop: 'auto',
    },
    capabilityItem: {
      fontSize: typography.fontSize.sm,
      color: colors.gray[700],
      marginBottom: spacing.sm,
      paddingLeft: spacing.lg,
      position: 'relative',
    },
    bullet: {
      position: 'absolute',
      left: 0,
      top: '0.4em',
      width: '4px',
      height: '4px',
      backgroundColor: colors.black,
      borderRadius: '50%',
    },
  };

  const hoverStyles = `
    .service-card:hover {
      box-shadow: ${shadows.lg};
      transform: translateY(-4px);
      border-color: ${colors.gray[300]};
    }
  `;

  return (
    <>
      <style>{hoverStyles}</style>
      <div style={styles.card} className="service-card">
        <div style={styles.number}>{number}</div>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
        <ul style={styles.capabilitiesList}>
          {capabilities.map((capability, index) => (
            <li key={index} style={styles.capabilityItem}>
              <span style={styles.bullet}></span>
              {capability}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

ServiceCard.propTypes = {
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  capabilities: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ServiceCard;
