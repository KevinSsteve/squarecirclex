# Tasks Document - Landing Page Redesign

## Overview

Implementação completa do redesign da landing page do Experta, seguindo o design inspirado no template Zenon. A implementação será feita de forma incremental, seção por seção, garantindo qualidade e testabilidade.

## Task Breakdown

### Phase 1: Foundation & Core Sections (Tasks 1-4)

#### Task 1: Setup Design System & Base Components
**Estimated Time:** 2 hours
**Dependencies:** None

**Description:**
Criar sistema de design base com constantes, utilitários e componentes reutilizáveis.

**Subtasks:**
1. Criar arquivo `frontend/src/styles/designSystem.js` com:
   - Paleta de cores
   - Tipografia (tamanhos, pesos)
   - Espaçamentos
   - Breakpoints responsivos
2. Criar componente `Button.jsx` reutilizável
3. Criar componente `SectionContainer.jsx` para layout consistente
4. Criar componente `Badge.jsx` para tags/badges

**Acceptance Criteria:**
- [ ] Design system exporta todas as constantes necessárias
- [ ] Componentes base são reutilizáveis e responsivos
- [ ] Componentes têm PropTypes definidos

---

#### Task 2: Implement Hero Section
**Estimated Time:** 2 hours
**Dependencies:** Task 1

**Description:**
Implementar seção hero completa com badge, headline, subheadline e CTAs.

**Subtasks:**
1. Criar componente `HeroSection.jsx`
2. Implementar badge "Powered by AI & AWS"
3. Implementar headline com tipografia grande
4. Adicionar subheadline explicativo
5. Adicionar dois CTAs (primário e secundário)
6. Implementar responsividade mobile/tablet/desktop

**Acceptance Criteria:**
- [ ] Hero section renderiza corretamente
- [ ] CTAs navegam para rotas corretas
- [ ] Layout responsivo funciona em todos os breakpoints
- [ ] Tipografia segue design system

---

#### Task 3: Implement Services Section
**Estimated Time:** 3 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de serviços com 6 cards numerados em grid responsivo.

**Subtasks:**
1. Criar componente `ServicesSection.jsx`
2. Criar componente `ServiceCard.jsx` para cada serviço
3. Implementar dados dos 6 serviços (conforme design.md)
4. Implementar grid responsivo (3 cols desktop, 2 cols tablet, 1 col mobile)
5. Adicionar animações de scroll (fade-in)
6. Implementar numeração (001, 002, etc)

**Acceptance Criteria:**
- [ ] 6 serviços renderizam corretamente
- [ ] Grid responsivo funciona em todos os breakpoints
- [ ] Animações de scroll são suaves
- [ ] Numeração está formatada corretamente

---

#### Task 4: Implement Process Section
**Estimated Time:** 2 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de processo com 4 etapas numeradas.

**Subtasks:**
1. Criar componente `ProcessSection.jsx`
2. Criar componente `ProcessStep.jsx` para cada etapa
3. Implementar dados das 4 etapas (conforme design.md)
4. Implementar layout progressivo visual
5. Adicionar CTA "Ver Preços"
6. Implementar responsividade

**Acceptance Criteria:**
- [ ] 4 etapas renderizam corretamente
- [ ] Layout progressivo é visualmente claro
- [ ] CTA navega para seção de preços
- [ ] Responsivo em todos os breakpoints

---

### Phase 2: Social Proof & Metrics (Tasks 5-7)

#### Task 5: Implement Case Studies Section
**Estimated Time:** 2 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de case studies com 3 casos em cards horizontais.

**Subtasks:**
1. Criar componente `CaseStudiesSection.jsx`
2. Criar componente `CaseStudyCard.jsx`
3. Implementar dados dos 3 casos (conforme design.md)
4. Implementar scroll horizontal em mobile
5. Implementar grid em desktop
6. Adicionar métricas destacadas (%, X)

**Acceptance Criteria:**
- [ ] 3 case studies renderizam corretamente
- [ ] Métricas são visualmente destacadas
- [ ] Scroll horizontal funciona em mobile
- [ ] Grid funciona em desktop

---

#### Task 6: Implement Metrics Section
**Estimated Time:** 2 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de métricas com 6 números impactantes e animação de contagem.

**Subtasks:**
1. Criar componente `MetricsSection.jsx`
2. Criar componente `MetricCard.jsx`
3. Implementar dados das 6 métricas (conforme design.md)
4. Implementar animação de contagem ao scroll (useIntersectionObserver)
5. Implementar grid responsivo (3x2 desktop, 2x3 tablet, 1x6 mobile)
6. Adicionar numeração (001-006)

**Acceptance Criteria:**
- [ ] 6 métricas renderizam corretamente
- [ ] Animação de contagem funciona ao scroll
- [ ] Grid responsivo funciona em todos os breakpoints
- [ ] Números são visualmente destacados

---

#### Task 7: Implement Testimonials Section
**Estimated Time:** 3 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de depoimentos com carousel horizontal.

**Subtasks:**
1. Criar componente `TestimonialsSection.jsx`
2. Criar componente `TestimonialCard.jsx`
3. Implementar dados dos 6 depoimentos (conforme design.md)
4. Implementar carousel com navegação manual (arrows + dots)
5. Implementar auto-play (5 segundos)
6. Implementar responsividade (1 card mobile, 2 cards tablet, 3 cards desktop)

**Acceptance Criteria:**
- [ ] 6 depoimentos renderizam corretamente
- [ ] Carousel funciona com navegação manual
- [ ] Auto-play funciona corretamente
- [ ] Responsivo em todos os breakpoints

---

### Phase 3: Pricing & Comparison (Tasks 8-9)

#### Task 8: Implement Pricing Section
**Estimated Time:** 3 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de preços com 3 planos e destaque para plano popular.

**Subtasks:**
1. Criar componente `PricingSection.jsx`
2. Criar componente `PricingCard.jsx`
3. Implementar dados dos 3 planos (conforme design.md)
4. Implementar toggle mensal/anual
5. Implementar destaque visual para plano popular
6. Adicionar CTAs "Get in touch" em cada plano
7. Implementar responsividade (stack em mobile)

**Acceptance Criteria:**
- [ ] 3 planos renderizam corretamente
- [ ] Toggle mensal/anual funciona
- [ ] Plano popular está destacado visualmente
- [ ] CTAs navegam corretamente
- [ ] Responsivo em todos os breakpoints

---

#### Task 9: Implement Comparison Section
**Estimated Time:** 2 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de comparação com 3 colunas (Freelancers vs Agências vs Experta).

**Subtasks:**
1. Criar componente `ComparisonSection.jsx`
2. Criar componente `ComparisonColumn.jsx`
3. Implementar dados das 3 colunas (conforme design.md)
4. Implementar destaque visual para coluna Experta
5. Implementar layout responsivo (stack em mobile)
6. Adicionar ícones/checkmarks para pontos

**Acceptance Criteria:**
- [ ] 3 colunas renderizam corretamente
- [ ] Coluna Experta está destacada
- [ ] Layout responsivo funciona
- [ ] Pontos de comparação são claros

---

### Phase 4: Interaction & Contact (Tasks 10-11)

#### Task 10: Implement FAQ Section
**Estimated Time:** 2 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de FAQs com accordion interativo.

**Subtasks:**
1. Criar componente `FAQSection.jsx`
2. Criar componente `FAQItem.jsx` com accordion
3. Implementar dados das 8 perguntas (conforme design.md)
4. Implementar lógica de expand/collapse (apenas 1 aberto por vez)
5. Implementar animação suave de expansão
6. Adicionar numeração (01-08)
7. Adicionar CTA "Get in touch" no final

**Acceptance Criteria:**
- [ ] 8 FAQs renderizam corretamente
- [ ] Accordion funciona (apenas 1 aberto por vez)
- [ ] Animação de expansão é suave
- [ ] Numeração está formatada corretamente
- [ ] CTA navega para seção de contacto

---

#### Task 11: Implement Contact Section
**Estimated Time:** 3 hours
**Dependencies:** Task 1

**Description:**
Implementar seção de contacto com formulário e informações de contacto.

**Subtasks:**
1. Criar componente `ContactSection.jsx`
2. Criar componente `ContactForm.jsx`
3. Implementar campos: Nome, Email, Website, Plano, Mensagem
4. Implementar validação de campos obrigatórios
5. Implementar lógica de submissão (console.log por enquanto)
6. Adicionar informações de contacto (email, telefone, localização)
7. Implementar layout responsivo (stack em mobile)

**Acceptance Criteria:**
- [ ] Formulário renderiza corretamente
- [ ] Validação funciona para campos obrigatórios
- [ ] Mensagens de erro são claras
- [ ] Informações de contacto são visíveis
- [ ] Layout responsivo funciona

---

### Phase 5: Polish & Optimization (Tasks 12-14)

#### Task 12: Implement Animations & Scroll Effects
**Estimated Time:** 2 hours
**Dependencies:** Tasks 2-11

**Description:**
Adicionar animações de scroll e efeitos visuais em todas as seções.

**Subtasks:**
1. Criar hook `useScrollAnimation.js` com IntersectionObserver
2. Adicionar fade-in animations em todas as seções
3. Adicionar parallax sutil no hero
4. Implementar smooth scroll para navegação interna
5. Otimizar performance das animações (GPU acceleration)

**Acceptance Criteria:**
- [ ] Animações funcionam em todas as seções
- [ ] Performance é mantida (60fps)
- [ ] Animações não repetem desnecessariamente
- [ ] Smooth scroll funciona

---

#### Task 13: Implement Accessibility Features
**Estimated Time:** 2 hours
**Dependencies:** Tasks 2-11

**Description:**
Garantir acessibilidade completa da landing page.

**Subtasks:**
1. Adicionar ARIA labels em todos os elementos interativos
2. Implementar navegação por teclado (Tab, Enter, Esc)
3. Adicionar focus indicators visuais
4. Verificar contraste de cores (WCAG AA)
5. Adicionar alt text em todas as imagens/ícones
6. Testar com screen reader

**Acceptance Criteria:**
- [ ] Todos os elementos são acessíveis via teclado
- [ ] ARIA labels estão corretos
- [ ] Contraste de cores passa WCAG AA
- [ ] Focus indicators são visíveis
- [ ] Screen reader funciona corretamente

---

#### Task 14: Performance Optimization & SEO ✅ COMPLETE
**Estimated Time:** 2 hours
**Dependencies:** Tasks 2-13
**Status:** ✅ COMPLETE

**Description:**
Otimizar performance e adicionar meta tags SEO.

**Subtasks:**
1. ✅ Implementar lazy loading para imagens
2. ✅ Implementar code splitting para seções pesadas
3. ✅ Otimizar bundle size (< 200KB inicial)
4. ✅ Adicionar meta tags SEO (title, description, og:tags)
5. ✅ Implementar structured data (JSON-LD)
6. ✅ Testar performance com Lighthouse (target: 90+)

**Acceptance Criteria:**
- [x] Lazy loading funciona
- [x] Bundle size está otimizado
- [x] Meta tags SEO estão corretas
- [x] Lighthouse score > 90
- [x] Tempo de carregamento < 3s

**Implementation Details:**
- Created `useLazyImage.js` hook with IntersectionObserver
- Implemented React.lazy() and Suspense for code splitting
- Added comprehensive SEO meta tags (Open Graph, Twitter Card)
- Implemented JSON-LD structured data for rich snippets
- Created performance monitoring utilities
- Added PWA support (manifest.json, service-worker.js)
- Created robots.txt and sitemap.xml
- Configured production optimizations

**Files Created:**
- `frontend/src/hooks/useLazyImage.js`
- `frontend/src/utils/performanceMonitor.js`
- `frontend/public/manifest.json`
- `frontend/public/service-worker.js`
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `frontend/.env.production`
- `LANDING_PAGE_TASK_14_COMPLETE.md`
- `LANDING_PAGE_PERFORMANCE_SETUP.md`

**Files Modified:**
- `frontend/src/pages/LandingPage.jsx` (lazy loading)
- `frontend/src/main.jsx` (Web Vitals)
- `frontend/public/index.html` (already had SEO tags)

---

## Testing Tasks

### Task 15: Unit Tests
**Estimated Time:** 3 hours
**Dependencies:** Tasks 2-11

**Description:**
Criar testes unitários para todos os componentes.

**Subtasks:**
1. Testar renderização de cada componente
2. Testar interações (clicks, form submission)
3. Testar validação de formulário
4. Testar accordion FAQ
5. Testar carousel de testimonials

**Acceptance Criteria:**
- [ ] Cobertura de testes > 80%
- [ ] Todos os testes passam
- [ ] Testes são rápidos (< 5s total)

---

### Task 16: Integration & Visual Tests
**Estimated Time:** 2 hours
**Dependencies:** Task 15

**Description:**
Criar testes de integração e visual regression.

**Subtasks:**
1. Testar scroll completo da página
2. Testar navegação entre seções
3. Testar responsividade em diferentes viewports
4. Criar screenshots de referência
5. Testar performance em dispositivos reais

**Acceptance Criteria:**
- [ ] Testes de integração passam
- [ ] Screenshots de referência criados
- [ ] Responsividade validada
- [ ] Performance validada

---

## Summary

**Total Tasks:** 16
**Estimated Total Time:** 37 hours
**Phases:** 5

**Critical Path:**
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10 → Task 11 → Task 12 → Task 13 → Task 14 → Task 15 → Task 16

**Recommended Order:**
1. Phase 1 (Foundation) - Tasks 1-4
2. Phase 2 (Social Proof) - Tasks 5-7
3. Phase 3 (Pricing) - Tasks 8-9
4. Phase 4 (Interaction) - Tasks 10-11
5. Phase 5 (Polish) - Tasks 12-14
6. Testing - Tasks 15-16

**Notes:**
- Cada task pode ser implementada e testada independentemente
- Recomenda-se fazer commit após cada task completa
- Testes devem ser escritos junto com a implementação
- Design system (Task 1) é fundamental para todas as outras tasks
