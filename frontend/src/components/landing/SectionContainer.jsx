import PropTypes from 'prop-types';
import { spacing, colors } from '../../styles/designSystem';

const SectionContainer = ({ 
  children, 
  className = '',
  background = 'white',
  noPadding = false,
  ...props 
}) => {
  const containerStyles = {
    width: '100%',
    backgroundColor: background === 'white' ? colors.white : background === 'gray' ? colors.gray[50] : background,
    paddingTop: noPadding ? 0 : spacing.section.vertical,
    paddingBottom: noPadding ? 0 : spacing.section.vertical,
  };

  const innerStyles = {
    maxWidth: spacing.container.maxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: spacing.container.padding,
    paddingRight: spacing.container.padding,
  };

  // Media query for mobile
  const mobileStyles = `
    @media (max-width: 768px) {
      .section-container {
        padding-top: ${noPadding ? 0 : spacing.section.verticalMobile};
        padding-bottom: ${noPadding ? 0 : spacing.section.verticalMobile};
      }
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <section 
        style={containerStyles} 
        className={`section-container ${className}`}
        {...props}
      >
        <div style={innerStyles}>
          {children}
        </div>
      </section>
    </>
  );
};

SectionContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  background: PropTypes.oneOfType([
    PropTypes.oneOf(['white', 'gray']),
    PropTypes.string,
  ]),
  noPadding: PropTypes.bool,
};

export default SectionContainer;
