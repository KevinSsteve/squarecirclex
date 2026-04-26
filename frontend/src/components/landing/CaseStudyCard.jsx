import PropTypes from 'prop-types';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/designSystem';

const CaseStudyCard = ({ title, metrics }) => {
  const styles = {
    card: {
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: borderRadius.xl,
      padding: spacing['2xl'],
      minWidth: '300px',
      flex: '1 1 300px',
      transition: 'all 0.3s ease',
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      marginBottom: spacing.xl,
      lineHeight: typography.lineHeight.tight,
    },
    metricsContainer: {
      display: 'flex',
      gap: spacing.xl,
      flexWrap: 'wrap',
    },
    metricItem: {
      flex: '1 1 120px',
    },
    metricValue: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      marginBottom: spacing.xs,
      lineHeight: typography.lineHeight.none,
    },
    metricLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.gray[600],
      lineHeight: typography.lineHeight.normal,
    },
  };

  const hoverStyles = `
    .case-study-card:hover {
      box-shadow: ${shadows.lg};
      transform: translateY(-4px);
      border-color: ${colors.gray[300]};
    }
  `;

  return (
    <>
      <style>{hoverStyles}</style>
      <div style={styles.card} className="case-study-card">
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.metricsContainer}>
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} style={styles.metricItem}>
              <div style={styles.metricValue}>{value.value}</div>
              <div style={styles.metricLabel}>{value.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

CaseStudyCard.propTypes = {
  title: PropTypes.string.isRequired,
  metrics: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default CaseStudyCard;
