import { Link } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useKeyboardNavigation } from '../hooks/useAccessibility';
import '../styles/accessibility.css';
import HeroSection from '../components/landing/HeroSection';

// Code splitting: Lazy load sections below the fold
const ServicesSection = lazy(() => import('../components/landing/ServicesSection'));
const ProcessSection = lazy(() => import('../components/landing/ProcessSection'));
const CaseStudiesSection = lazy(() => import('../components/landing/CaseStudiesSection'));
const MetricsSection = lazy(() => import('../components/landing/MetricsSection'));
const TestimonialsSection = lazy(() => import('../components/landing/TestimonialsSection'));
const PricingSection = lazy(() => import('../components/landing/PricingSection'));
const ComparisonSection = lazy(() => import('../components/landing/ComparisonSection'));
const FAQSection = lazy(() => import('../components/landing/FAQSection'));
const ContactSection = lazy(() => import('../components/landing/ContactSection'));

const LandingPage = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();
  // Smooth scroll for anchor links
  useEffect(() => {
    const handleSmoothScroll = (e) => {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, []);
  return (
    <div className="min-h-screen bg-white select-none">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Minimalist Header */}
      <header className="border-b border-gray-100" role="banner">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" aria-label="Square Circle X Home">
                <span className="text-xl font-bold text-gray-900 tracking-tight">SCX</span>
              </Link>
            </div>
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              aria-label="Login to your account"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main">

      {/* Hero Section - Loaded immediately */}
      <div id="hero">
        <HeroSection />
      </div>

      {/* Lazy-loaded sections with loading fallback */}
      <Suspense fallback={<div className="py-20 text-center text-gray-400">Carregando...</div>}>
        {/* Services Section */}
        <section id="services" aria-labelledby="services-heading">
          <ServicesSection />
        </section>

        {/* Process Section */}
        <section id="process" aria-labelledby="process-heading">
          <ProcessSection />
        </section>

        {/* Case Studies Section */}
        <section id="cases" aria-labelledby="cases-heading">
          <CaseStudiesSection />
        </section>

        {/* Metrics Section */}
        <section id="metrics" aria-labelledby="metrics-heading">
          <MetricsSection />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" aria-labelledby="testimonials-heading">
          <TestimonialsSection />
        </section>

        {/* Pricing Section */}
        <section id="pricing" aria-labelledby="pricing-heading">
          <PricingSection />
        </section>

        {/* Comparison Section */}
        <section id="comparison" aria-labelledby="comparison-heading">
          <ComparisonSection />
        </section>

        {/* FAQ Section */}
        <section id="faq" aria-labelledby="faq-heading">
          <FAQSection />
        </section>

        {/* Contact Section */}
        <section id="contact" aria-labelledby="contact-heading">
          <ContactSection />
        </section>
      </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-20" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">© 2026 Square Circle X. Todos os direitos reservados.</span>
            </div>
            <div className="text-xs text-gray-500">
              Powered by AWS Bedrock & Claude 3.5 Sonnet
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;