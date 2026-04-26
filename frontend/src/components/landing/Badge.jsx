import PropTypes from 'prop-types';
import { colors, borderRadius, typography } from '../../styles/designSystem';

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.full,
    whiteSpace: 'nowrap',
  };

  const variants = {
    default: {
      backgroundColor: colors.gray[50],
      color: colors.gray[700],
      border: `1px solid ${colors.gray[200]}`,
    },
    primary: {
      backgroundColor: colors.black,
      color: colors.white,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.gray[700],
      border: `1px solid ${colors.gray[300]}`,
    },
  };

  const sizes = {
    sm: {
      padding: '0.25rem 0.75rem',
      fontSize: typography.fontSize.xs,
    },
    md: {
      padding: '0.375rem 1rem',
      fontSize: typography.fontSize.sm,
    },
    lg: {
      padding: '0.5rem 1.25rem',
      fontSize: typography.fontSize.base,
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
  };

  return (
    <span 
      style={combinedStyles}
      className={`badge badge-${variant} badge-${size} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Badge;
