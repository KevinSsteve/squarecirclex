import { Link } from 'react-router-dom';
import HeroSection from '../components/landing/HeroSection';
import ServicesSection from '../components/landing/ServicesSection';
import ProcessSection from '../components/landing/ProcessSection';
import CaseStudiesSection from '../components/landing/CaseStudiesSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white select-none">
      {/* Minimalist Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">experta</span>
            </div>
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Process Section */}
      <ProcessSection />

      {/* Case Studies Section */}
      <CaseStudiesSection />

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">© 2026 Experta. Todos os direitos reservados.</span>
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