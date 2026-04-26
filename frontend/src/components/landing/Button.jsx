import PropTypes from 'prop-types';
import { colors, borderRadius, shadows, transitions } from '../../styles/designSystem';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  href,
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: borderRadius.xl,
    transition: `all ${transitions.duration.base} ${transitions.timing.easeInOut}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    textDecoration: 'none',
    opacity: disabled ? 0.5 : 1,
  };

  const variants = {
    primary: {
      backgroundColor: colors.black,
      color: colors.white,
      boxShadow: shadows.lg,
      ':hover': !disabled && {
        backgroundColor: colors.gray[800],
        boxShadow: shadows.xl,
        transform: 'translateY(-2px)',
      },
    },
    secondary: {
      backgroundColor: colors.white,
      color: colors.black,
      border: `2px solid ${colors.gray[200]}`,
      ':hover': !disabled && {
        backgroundColor: colors.gray[50],
        borderColor: colors.gray[300],
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.gray[700],
      ':hover': !disabled && {
        backgroundColor: colors.gray[100],
      },
    },
  };

  const sizes = {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
    },
    md: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
    },
    lg: {
      padding: '1rem 2rem',
      fontSize: '1.125rem',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
  };

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  // If href is provided, render as anchor
  if (href && !disabled) {
    return (
      <a
        href={href}
        style={combinedStyles}
        className={`button button-${variant} button-${size} ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Otherwise render as button
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={combinedStyles}
      className={`button button-${variant} button-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func,
  href: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;
