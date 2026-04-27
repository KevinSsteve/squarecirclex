import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import PropTypes from 'prop-types';
import designSystem from '../../styles/designSystem';

const MetricCard = ({ number, value, label, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      animateValue();
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, delay]);

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
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.6, 
        delay: delay / 1000,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        y: -8,
        boxShadow: designSystem.shadows.hover,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      style={{
        padding: designSystem.spacing.xl,
        backgroundColor: designSystem.colors.white,
        border: `1px solid ${designSystem.colors.gray[200]}`,
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'default',
      }}
    >
      {/* Number Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{ delay: (delay / 1000) + 0.2, duration: 0.4 }}
        style={{
          display: 'inline-block',
          padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
          backgroundColor: designSystem.colors.gray[100],
          borderRadius: '4px',
          fontSize: designSystem.typography.fontSize.xs,
          fontWeight: designSystem.typography.fontWeight.medium,
          color: designSystem.colors.gray[600],
          marginBottom: designSystem.spacing.md,
          fontFamily: 'monospace'
        }}
      >
        {number}
      </motion.div>

      {/* Metric Value */}
      <div
        style={{
          fontSize: designSystem.typography.fontSize['4xl'],
          fontWeight: designSystem.typography.fontWeight.bold,
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
          fontSize: designSystem.typography.fontSize.base,
          color: designSystem.colors.gray[600],
          fontWeight: designSystem.typography.fontWeight.medium
        }}
      >
        {label}
      </div>
    </motion.div>
  );
};

MetricCard.propTypes = {
  number: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  delay: PropTypes.number
};

export default MetricCard;
