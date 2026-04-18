import { Link } from 'react-router-dom';

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
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 mb-8">
          <span className="text-sm font-medium text-gray-700">✨ Powered by AWS & AI</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Gestão de Redes Sociais
          <br />
          <span className="text-gray-900">Inteligente e Automática</span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Crie conteúdo profissional, gere imagens únicas e planeie a sua estratégia de redes sociais 
          com inteligência artificial avançada. Tudo numa plataforma simples e poderosa.
        </p>

        {/* CTA Button */}
        <Link
          to="/signup"
          className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Começar Gratuitamente
        </Link>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Criação de Conteúdo</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Gere legendas profissionais, hashtags relevantes e descrições envolventes 
              com IA treinada para redes sociais.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geração de Imagens</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Crie imagens únicas e profissionais com AWS Titan Image Generator. 
              Perfeitas para o seu conteúdo e marca.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Planeamento Estratégico</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Planeie semanas de conteúdo automaticamente. Calendário inteligente 
              adaptado ao seu nicho e audiência.
            </p>
          </div>
        </div>
      </section>

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