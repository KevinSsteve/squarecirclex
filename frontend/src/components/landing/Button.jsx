import { motion } from 'motion/react';
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
    },
    secondary: {
      backgroundColor: colors.white,
      color: colors.black,
      border: `2px solid ${colors.gray[200]}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.gray[700],
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

  // Animation variants based on button variant
  const hoverAnimation = !disabled ? {
    scale: 1.02,
    y: -2,
    boxShadow: variant === 'primary' ? shadows.hover : shadows.md,
    backgroundColor: variant === 'primary' ? colors.gray[800] : 
                     variant === 'secondary' ? colors.gray[50] : 
                     colors.gray[100],
  } : {};

  const tapAnimation = !disabled ? {
    scale: 0.98,
  } : {};

  // If href is provided, render as motion anchor
  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        style={combinedStyles}
        className={`button button-${variant} button-${size} ${className}`}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {children}
      </motion.a>
    );
  }

  // Otherwise render as motion button
  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      style={combinedStyles}
      className={`button button-${variant} button-${size} ${className}`}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.button>
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
