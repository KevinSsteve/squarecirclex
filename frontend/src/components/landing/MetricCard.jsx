import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import designSystem from '../../styles/designSystem';

const MetricCard = ({ number, value, label, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timeout = setTimeout(() => {
      animateValue();
    }, delay);

    return () => clearTimeout(timeout);
  }, [isVisible, delay]);

  const animateValue = () => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    // Extract numeric value and suffix
    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetValue = parseFloat(match[1]);
    const suffix = match[2];
    const increment = targetValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        // Format based on whether it's a decimal or integer
        const formatted = targetValue % 1 === 0 
          ? Math.floor(current).toString()
          : current.toFixed(1);
        setDisplayValue(formatted + suffix);
      }
    }, stepDuration);
  };

  return (
    <div
      ref={cardRef}
      style={{
        padding: designSystem.spacing.xl,
        backgroundColor: designSystem.colors.white,
        border: `1px solid ${designSystem.colors.gray[200]}`,
        borderRadius: '8px',
        textAlign: 'center',
        transition: `all ${designSystem.transitions.normal}`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        cursor: 'default',
        ':hover': {
          transform: 'translateY(-4px)',
          boxShadow: designSystem.shadows.lg
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = designSystem.shadows.lg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Number Badge */}
      <div
        style={{
          display: 'inline-block',
          padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
          backgroundColor: designSystem.colors.gray[100],
          borderRadius: '4px',
          fontSize: designSystem.typography.sizes.xs,
          fontWeight: designSystem.typography.weights.medium,
          color: designSystem.colors.gray[600],
          marginBottom: designSystem.spacing.md,
          fontFamily: 'monospace'
        }}
      >
        {number}
      </div>

      {/* Metric Value */}
      <div
        style={{
          fontSize: designSystem.typography.sizes['4xl'],
          fontWeight: designSystem.typography.weights.bold,
          color: designSystem.colors.black,
          marginBottom: designSystem.spacing.sm,
          lineHeight: 1.2
        }}
      >
        {displayValue}
      </div>

      {/* Metric Label */}
      <div
        style={{
          fontSize: designSystem.typography.sizes.base,
          color: designSystem.colors.gray[600],
          fontWeight: designSystem.typography.weights.medium
        }}
      >
        {label}
      </div>
    </div>
  );
};

MetricCard.propTypes = {
  number: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  delay: PropTypes.number
};

export default MetricCard;
