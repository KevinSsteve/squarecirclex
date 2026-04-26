import PropTypes from 'prop-types';
import { colors, typography, spacing } from '../../styles/designSystem';

const ProcessStep = ({ number, title, description, isLast }) => {
  const styles = {
    container: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      flex: 1,
    },
    numberBadge: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: colors.black,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.xl,
      position: 'relative',
      zIndex: 2,
    },
    connector: {
      position: 'absolute',
      top: '40px',
      left: '50%',
      width: '100%',
      height: '2px',
      backgroundColor: colors.gray[200],
      zIndex: 1,
      display: isLast ? 'none' : 'block',
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      marginBottom: spacing.md,
      lineHeight: typography.lineHeight.tight,
    },
    description: {
      fontSize: typography.fontSize.base,
      color: colors.gray[600],
      lineHeight: typography.lineHeight.relaxed,
      maxWidth: '280px',
    },
  };

  const mobileStyles = `
    @media (max-width: 768px) {
      .process-step-container {
        margin-bottom: ${spacing['3xl']};
      }
      .process-step-connector {
        display: none !important;
      }
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <div style={styles.container} className="process-step-container">
        <div style={styles.numberBadge}>{number}</div>
        {!isLast && <div style={styles.connector} className="process-step-connector"></div>}
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
      </div>
    </>
  );
};

ProcessStep.propTypes = {
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  isLast: PropTypes.bool,
};

ProcessStep.defaultProps = {
  isLast: false,
};

export default ProcessStep;
