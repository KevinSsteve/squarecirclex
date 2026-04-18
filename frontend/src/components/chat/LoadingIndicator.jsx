import { useEffect, useState } from 'react';

const LoadingIndicator = () => {
  const [phase, setPhase] = useState('analyzing');

  const phases = [
    {
      id: 'analyzing',
      icon: '🧠',
      text: 'Analisando sua solicitação...',
      duration: 3000,
      color: 'text-blue-600'
    },
    {
      id: 'writing',
      icon: '✍️',
      text: 'Escrevendo conteúdo criativo...',
      duration: 4000,
      color: 'text-purple-600'
    },
    {
      id: 'drawing',
      icon: '✨',
      text: 'Gerando imagem com IA...',
      duration: 0, // Stays until complete
      color: 'text-pink-600'
    }
  ];

  useEffect(() => {
    // Analyzing phase (0-3s)
    const timer1 = setTimeout(() => {
      setPhase('writing');
    }, 3000);

    // Writing phase (3-7s)
    const timer2 = setTimeout(() => {
      setPhase('drawing');
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const currentPhase = phases.find(p => p.id === phase);

  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-gray-100 max-w-md">
        <div className="flex items-center space-x-2">
          {/* Animated Icon */}
          <div className="text-2xl animate-bounce">
            {currentPhase.icon}
          </div>

          {/* Text and Progress */}
          <div className="flex-1">
            <p className={`text-sm font-medium ${currentPhase.color}`}>
              {currentPhase.text}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-1000 ${
                  phase === 'analyzing' ? 'w-1/3' :
                  phase === 'writing' ? 'w-2/3' :
                  'w-full animate-pulse'
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* Phase Indicators */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span className={phase === 'analyzing' ? 'text-blue-600 font-semibold' : ''}>
            Análise
          </span>
          <span className={phase === 'writing' ? 'text-purple-600 font-semibold' : ''}>
            Escrita
          </span>
          <span className={phase === 'drawing' ? 'text-pink-600 font-semibold' : ''}>
            Imagem
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
