import { useState } from 'react';
import SectionContainer from './SectionContainer';
import FAQItem from './FAQItem';
import Button from './Button';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      number: '01',
      question: 'Quanto tempo demora a ver resultados?',
      answer: 'A maioria dos clientes começa a ver melhorias nas primeiras 2-4 semanas. Resultados significativos em engagement e crescimento de audiência geralmente aparecem entre 2-3 meses de trabalho consistente.'
    },
    {
      number: '02',
      question: 'Garantem rankings específicos?',
      answer: 'Não garantimos rankings específicos porque o algoritmo das redes sociais está em constante mudança. No entanto, garantimos uma estratégia baseada em dados, conteúdo de qualidade consistente e otimização contínua para maximizar o seu alcance orgânico.'
    },
    {
      number: '03',
      question: 'É adequado para empresas em fase inicial?',
      answer: 'Sim! O nosso plano Starter foi desenhado especificamente para empresas em fase inicial. Oferecemos as ferramentas essenciais de IA e automação para começar a construir presença online sem necessitar de uma equipa dedicada.'
    },
    {
      number: '04',
      question: 'O que torna a vossa abordagem diferente?',
      answer: 'Combinamos IA avançada (AWS Bedrock, Claude 3.5 Sonnet) com estratégia humana. Não somos apenas uma ferramenta de automação - fornecemos análise estratégica, insights acionáveis e otimização contínua baseada em performance real.'
    },
    {
      number: '05',
      question: 'Trabalham com contratos de longo prazo?',
      answer: 'Não. Todos os nossos planos são mensais ou anuais (com desconto), sem compromissos de longo prazo. Pode cancelar a qualquer momento. Acreditamos em ganhar a sua confiança através de resultados, não através de contratos.'
    },
    {
      number: '06',
      question: 'Como medem a performance?',
      answer: 'Monitorizamos métricas-chave como engagement rate, alcance, crescimento de seguidores, clicks, conversões e ROI. Fornecemos relatórios claros e focados nas métricas que realmente importam para o seu negócio.'
    },
    {
      number: '07',
      question: 'A IA vai substituir a estratégia humana?',
      answer: 'Não. A IA é uma ferramenta poderosa para execução e análise, mas a estratégia, criatividade e compreensão do seu negócio requerem inteligência humana. Usamos IA para amplificar capacidades, não para substituir pensamento estratégico.'
    },
    {
      number: '08',
      question: 'Como começamos?',
      answer: 'Simples: escolha um plano, crie a sua conta e complete o onboarding guiado. A nossa IA vai fazer perguntas sobre o seu negócio, audiência e objetivos. Em menos de 10 minutos está pronto para começar a gerar conteúdo.'
    }
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SectionContainer background="white">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 id="faq-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Respostas claras às questões mais comuns sobre a nossa plataforma
          </p>
        </div>

        {/* FAQ List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              number={faq.number}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Ainda tem dúvidas? Estamos aqui para ajudar.
          </p>
          <Button
            variant="secondary"
            size="large"
            onClick={() => {
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Entrar em Contacto
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
};

export default FAQSection;
