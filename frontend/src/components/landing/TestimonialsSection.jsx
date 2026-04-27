import { useState, useEffect, useRef } from 'react';
import SectionContainer from './SectionContainer';
import TestimonialCard from './TestimonialCard';

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);

  const testimonials = [
    {
      quote: "A Experta transformou completamente a nossa presença digital. Em apenas 3 meses, vimos um crescimento de 142% no engagement e conseguimos triplicar o nosso alcance orgânico.",
      author: "Sofia Martins",
      role: "CEO, Boutique Fashion",
      date: "Janeiro 2026"
    },
    {
      quote: "Finalmente encontrámos uma solução que combina estratégia humana com eficiência de IA. A qualidade do conteúdo gerado é impressionante e poupa-nos horas de trabalho manual.",
      author: "Ricardo Santos",
      role: "Marketing Director, TechStart",
      date: "Dezembro 2025"
    },
    {
      quote: "O ROI que conseguimos com a Experta superou todas as expectativas. A automação inteligente permite-nos focar na estratégia enquanto a plataforma cuida da execução.",
      author: "Ana Costa",
      role: "Founder, Wellness Studio",
      date: "Novembro 2025"
    },
    {
      quote: "A integração com as nossas plataformas foi perfeita e o suporte é excecional. Conseguimos escalar a nossa produção de conteúdo sem aumentar a equipa.",
      author: "Miguel Ferreira",
      role: "CMO, Restaurant Group",
      date: "Outubro 2025"
    },
    {
      quote: "Testámos várias ferramentas de gestão de redes sociais, mas nenhuma oferece o nível de personalização e inteligência da Experta. É um game-changer.",
      author: "Beatriz Oliveira",
      role: "Social Media Manager, Agency",
      date: "Setembro 2025"
    },
    {
      quote: "A capacidade de gerar imagens únicas com IA e criar conteúdo consistente com a nossa marca é incrível. Recomendo a qualquer empresa que queira crescer online.",
      author: "João Almeida",
      role: "Director, Consulting Firm",
      date: "Agosto 2025"
    }
  ];

  // Calculate how many cards to show based on screen size
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 3; // Desktop: 3 cards
    if (window.innerWidth >= 768) return 2;  // Tablet: 2 cards
    return 1; // Mobile: 1 card
  };

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView());

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, testimonials.length - cardsPerView);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, 5000); // 5 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, maxIndex]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <SectionContainer background="gray">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Confiado por Equipas de Crescimento
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Veja o que os nossos clientes dizem sobre os resultados alcançados
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Testimonials Track */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-4"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-gray-200 rounded-full p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          aria-label="Previous testimonial"
        >
          <svg
            className="w-5 h-5 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-gray-200 rounded-full p-3 shadow-md hover:shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          aria-label="Next testimonial"
        >
          <svg
            className="w-5 h-5 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center items-center gap-2 mt-8">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
              index === currentIndex
                ? 'w-8 bg-gray-900'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </SectionContainer>
  );
};

export default TestimonialsSection;
