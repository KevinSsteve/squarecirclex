# Requirements Document - Office Manager Game (Top-Down)

## Introdução

Este documento especifica os requisitos para transformar o game layer em um simulador de gerenciamento de escritório em visão top-down, onde o usuário controla um personagem que contrata e gerencia agentes em um ambiente de escritório realista.

### Decisão de Assets

Após análise completa (ver `MODERN_OFFICE_REVAMPED_ANALYSIS.md` e `DECISAO_FINAL_MODERN_OFFICE.md`), decidimos usar:

**Modern Office Revamped v1.2 + Modern Interiors** (ambos por LimeZu)

**Razões**:
- ✅ Qualidade profissional superior (339+ sprites individuais)
- ✅ Completude: pisos, paredes, móveis, decorações tudo incluído
- ✅ Compatibilidade perfeita: mesmo autor, mesmo estilo
- ✅ Custo menor: $5-10 (só personagens, já temos Modern Office)
- ✅ Melhor documentação: exemplos, arquivos editáveis
- ✅ Flexibilidade: 3 tamanhos, com/sem sombras

Esta escolha substitui o plano anterior de usar Office Interior Tileset + múltiplos packs incompatíveis.

## Glossário

- **Top-Down View**: Visão de cima para baixo (bird's eye view)
- **Player Character**: Personagem controlável pelo usuário
- **NPC Agent**: Agente não-jogável contratado pelo usuário
- **Office Tileset**: Conjunto de tiles 16x16 para ambiente de escritório
- **Department Zone**: Área colorida que identifica um departamento

---

## Visão Geral

### Conceito do Jogo

O usuário é o gerente de uma agência de marketing digital. Ele controla um personagem que se move pelo escritório, contrata agentes especializados, e os observa trabalhando em diferentes departamentos.

### Mudança de Paradigma

**Antes (Isométrico)**:
- Visão isométrica 3D
- Sem controle direto do jogador
- Foco em visualização passiva

**Agora (Top-Down)**:
- Visão top-down 2D
- Jogador controlável (WASD/setas)
- Interação ativa com o ambiente
- Simulação de escritório

---

## User Stories

### US-1: Controle do Jogador
**Como** usuário  
**Quero** controlar um personagem no escritório  
**Para** me sentir presente e ativo no ambiente

**Critérios de Aceitação**:
- Posso mover meu personagem com WASD ou setas
- Personagem tem animação de caminhada em 4 ou 8 direções
- Movimento é suave e responsivo
- Personagem não atravessa paredes ou móveis
- Câmera segue o personagem

### US-2: Visualização do Escritório
**Como** usuário  
**Quero** ver um escritório realista com móveis e decorações  
**Para** ter uma experiência imersiva

**Critérios de Aceitação**:
- Escritório tem pisos, paredes, janelas
- Cada departamento tem móveis apropriados (mesas, cadeiras)
- Decorações temáticas por departamento
- Carpetes coloridos identificam departamentos
- Visual limpo e organizado

### US-3: Contratação de Agentes
**Como** usuário  
**Quero** contratar agentes clicando em áreas específicas  
**Para** expandir minha equipe

**Critérios de Aceitação**:
- Posso clicar em um departamento para contratar agente
- Agente aparece em uma mesa disponível
- Cada tipo de agente tem cor/visual único
- Limite de agentes por departamento respeitado
- Feedback visual ao contratar

### US-4: Agentes Trabalhando
**Como** usuário  
**Quero** ver agentes trabalhando em suas mesas  
**Para** sentir que o escritório está ativo

**Critérios de Aceitação**:
- Agentes têm animação de trabalho (digitando)
- Agentes ocasionalmente se movem (café, reunião)
- Indicadores visuais de progresso de tarefas
- Partículas/efeitos quando completam tarefas
- Agentes interagem com o ambiente

### US-5: Identificação de Departamentos
**Como** usuário  
**Quero** identificar facilmente cada departamento  
**Para** entender a organização do escritório

**Critérios de Aceitação**:
- Cada departamento tem carpete de cor única
- Labels/placas identificam departamentos
- Móveis e decorações temáticas
- Cores consistentes com a identidade visual:
  - Content Creation: Indigo
  - Publishing: Green
  - Trend Analysis: Amber
  - Customer Support: Purple
  - Administration: Gray

### US-6: Interação com Ambiente
**Como** usuário  
**Quero** interagir com objetos e agentes  
**Para** ter controle sobre o escritório

**Critérios de Aceitação**:
- Posso clicar em agentes para ver detalhes
- Posso clicar em mesas para atribuir tarefas
- Hover mostra informações contextuais
- Feedback visual em interações
- Menu de contexto para ações

### US-7: Câmera e Navegação
**Como** usuário  
**Quero** navegar facilmente pelo escritório  
**Para** ver todas as áreas

**Critérios de Aceitação**:
- Câmera segue o jogador suavemente
- Posso dar zoom in/out (scroll)
- Posso clicar no minimapa para mover câmera
- Câmera tem limites (não sai do escritório)
- Transições suaves

### US-8: Performance
**Como** usuário  
**Quero** que o jogo rode suavemente  
**Para** ter uma experiência fluida

**Critérios de Aceitação**:
- 60 FPS em desktop (1920x1080)
- 30 FPS em dispositivos móveis
- Tempo de carregamento < 3 segundos
- Sem lag ao mover personagem
- Sem stuttering em animações

---

## Requisitos Funcionais

### RF-1: Sistema de Movimento do Jogador
- Controle por teclado (WASD, setas)
- Controle por clique (pathfinding)
- Velocidade configurável
- Colisão com obstáculos
- Animação baseada em direção

### RF-2: Sistema de Renderização Top-Down
- Renderizar tiles 16x16 (Modern Office Revamped)
- Sistema de layers (floor, objects, characters, UI)
- Z-index simples (Y-sorting)
- Sprite batching para performance
- Culling de objetos fora da tela
- Suporte para múltiplos formatos (16x, 32x, 48x)

### RF-3: Sistema de Departamentos
- 5 departamentos distintos
- Carpetes coloridos por departamento
- Móveis específicos por tipo
- Decorações temáticas
- Limites de área definidos

### RF-4: Sistema de Agentes NPC
- Agentes trabalham em mesas
- Animações: idle, walking, working
- Movimento ocasional (pathfinding)
- Estados: idle, working, moving, celebrating
- Indicadores visuais de status

### RF-5: Sistema de Interação
- Click em agentes (detalhes)
- Click em mesas (atribuir tarefa)
- Hover para tooltips
- Menu de contexto
- Feedback visual

### RF-6: Sistema de Câmera
- Segue jogador
- Zoom in/out
- Pan manual (arrastar)
- Limites do escritório
- Transições suaves

### RF-7: Sistema de UI
- Minimapa
- Lista de agentes
- Fila de tarefas
- Painel de detalhes
- Controles de câmera

### RF-8: Sistema de Assets
- Carregamento de sprite sheets (Modern Office + Modern Interiors)
- Atlas definitions (JSON)
- Caching de texturas
- Loading progressivo
- Fallbacks para assets faltando
- Suporte para múltiplos tamanhos (16x, 32x, 48x)
- Gerenciamento de versões com/sem sombras

---

## Requisitos Não-Funcionais

### RNF-1: Performance
- 60 FPS em desktop
- 30 FPS em mobile
- < 3s tempo de carregamento
- < 100 MB tamanho total de assets
- Memória < 500 MB

### RNF-2: Compatibilidade
- Chrome, Firefox, Safari, Edge (últimas 2 versões)
- Desktop: Windows, macOS, Linux
- Mobile: iOS 14+, Android 10+
- Resolução mínima: 1280x720

### RNF-3: Usabilidade
- Controles intuitivos
- Feedback visual claro
- Tooltips informativos
- Sem necessidade de tutorial
- Acessível (keyboard navigation)

### RNF-4: Manutenibilidade
- Código modular
- Documentação clara
- Fácil adicionar novos assets
- Fácil adicionar novos departamentos
- Sistema de configuração

### RNF-5: Escalabilidade
- Suporta até 20 agentes
- Suporta até 10 departamentos (futuro)
- Suporta múltiplos andares (futuro)
- Sistema de save/load (futuro)

---

## Assets Necessários

### 1. Modern Office Revamped v1.2 (Principal) ✅
**Source**: LimeZu - Modern Office Revamped v1.2  
**Status**: ✅ JÁ BAIXADO em `downloads/Modern_Office_Revamped_v1.2/`  
**License**: Uso comercial permitido, edição permitida, não pode revender  
**Qualidade**: ⭐⭐⭐⭐⭐ Profissional (339+ sprites individuais)

**Conteúdo Completo**:

#### Móveis de Escritório (339+ sprites):
- Mesas (múltiplas variações, tamanhos, cores)
- Cadeiras (executivas, normais, giratórias)
- Estantes e armários
- Arquivos e gavetas
- Mesas de reunião
- Recepção

#### Equipamentos:
- Computadores (desktops, monitores)
- Laptops
- Impressoras
- Máquina de café (múltiplas variações)
- Telefones
- Equipamentos de escritório

#### Decorações:
- Plantas (múltiplas variações)
- Quadros e pôsteres
- Relógios e calendários
- Itens de mesa
- Malas e pastas (4 cores)
- Pilhas de dinheiro (3 tipos)

#### Ambiente (Room Builder):
- ✅ Pisos (múltiplas texturas)
- ✅ Paredes (múltiplas variações)
- ✅ Janelas e portas
- ✅ Sistema completo de construção de salas

#### Formatos Disponíveis:
- 16x16 (nativo)
- 32x32 (scaled)
- 48x48 (scaled)
- Sprites individuais (339 arquivos)
- Sprite sheets completos
- Com e sem sombras

#### Exemplos:
- 2 designs de escritório completos (GIFs)
- Arquivos Aseprite editáveis

### 2. Modern Interiors (Personagens) ⏳
**Source**: LimeZu - Modern Interiors  
**Status**: ⏳ PRECISA COMPRAR ($5-10)  
**License**: Uso comercial permitido (mesmo autor)  
**Compatibilidade**: ✅ 100% compatível com Modern Office Revamped

**Conteúdo**:
- Character Generator completo
- Múltiplos personagens pré-feitos
- Animações completas:
  - Idle (parado)
  - Walk (andando) - 4 direções
  - Run (correndo)
  - Sit (sentado)
  - Talk (falando) - 10 frames
  - Nod (acenando) - 10 frames
  - Shake Head (negando) - 10 frames
- Múltiplas roupas e estilos
- Variações de cor para diferenciar agentes

**Link**: https://limezu.itch.io/moderninteriors

### 3. Carpetes Customizados (Criar)
**Conteúdo**:
- 5 carpetes coloridos (16x16)
- Cores dos departamentos:
  - Content Creation: Indigo
  - Publishing: Green
  - Trend Analysis: Amber
  - Customer Support: Purple
  - Administration: Gray
- Padrão simples ou sólido
- Compatível com estilo LimeZu

### 4. Effects & UI (Criar/Reutilizar)
**Conteúdo**:
- Sombras (usar versão shadowless do Modern Office)
- Partículas (sparkles, stars) - reutilizar existentes
- UI elements (buttons, panels) - reutilizar existentes
- Icons (department, agent types) - reutilizar existentes

---

## Organização de Assets

### Estrutura de Pastas do Modern Office Revamped

```
downloads/Modern_Office_Revamped_v1.2/
├── 16x16/
│   ├── Modern_Office_Singles_16x16_v1.2.png (339 sprites individuais)
│   ├── Modern_Office_Singles_16x16_v1.2_shadowless.png
│   ├── Modern_Office_Singles_SpriteSheet_16x16_v1.2.png
│   └── Modern_Office_Singles_SpriteSheet_16x16_v1.2_shadowless.png
├── 32x32/
│   ├── Modern_Office_Singles_32x32_v1.2.png
│   ├── Modern_Office_Singles_32x32_v1.2_shadowless.png
│   ├── Modern_Office_Singles_SpriteSheet_32x32_v1.2.png
│   └── Modern_Office_Singles_SpriteSheet_32x32_v1.2_shadowless.png
├── 48x48/
│   ├── Modern_Office_Singles_48x48_v1.2.png
│   ├── Modern_Office_Singles_48x48_v1.2_shadowless.png
│   ├── Modern_Office_Singles_SpriteSheet_48x48_v1.2.png
│   └── Modern_Office_Singles_SpriteSheet_48x48_v1.2_shadowless.png
├── Room_Builder/
│   ├── Modern_Office_Room_Builder_16x16_v1.2.png (pisos e paredes)
│   ├── Modern_Office_Room_Builder_32x32_v1.2.png
│   └── Modern_Office_Room_Builder_48x48_v1.2.png
├── Aseprite_Files/
│   └── [arquivos editáveis]
├── Examples/
│   ├── Example_1.gif
│   └── Example_2.gif
└── LICENSE.txt
```

### Estrutura de Assets no Projeto

```
/public/assets/sprites/
├── office/
│   ├── furniture/
│   │   ├── modern-office-16x16.png (sprite sheet principal)
│   │   ├── modern-office-16x16.json (atlas definition)
│   │   └── modern-office-16x16-shadowless.png
│   ├── environment/
│   │   ├── room-builder-16x16.png (pisos e paredes)
│   │   ├── room-builder-16x16.json
│   │   └── carpets-custom.png (5 cores de departamentos)
│   └── decorations/
│       └── [organizados por tipo]
├── characters/
│   ├── modern-interiors-idle.png (Modern Interiors)
│   ├── modern-interiors-idle.json
│   ├── modern-interiors-walk.png
│   ├── modern-interiors-walk.json
│   ├── modern-interiors-sit.png
│   └── modern-interiors-sit.json
└── effects/
    └── [partículas e efeitos]
```

### Tamanho Recomendado

**Para este projeto**: Usar **16x16** (nativo)
- Melhor performance
- Estilo pixel art autêntico
- Menor tamanho de arquivo
- Mais sprites na tela

**Alternativas**:
- 32x32: Para telas maiores ou zoom
- 48x48: Para alta resolução

---

## Constraints

### Técnicas
- Usar PixiJS (já implementado)
- Manter arquitetura ECS existente
- Compatível com sistemas existentes (StateSyncSystem, TaskExecutionSystem)
- Não quebrar funcionalidades atuais
- Usar Modern Office Revamped v1.2 como base de assets

### Visuais
- Estilo pixel art 16x16 (Modern Office Revamped)
- Paleta de cores consistente (LimeZu)
- Top-down view (não isométrico)
- Sem animações 3D complexas
- Usar versão shadowless para controle manual de sombras

### Tempo
- Implementação: 7-9 dias (inclui 1 dia para organizar assets)
- Testes: 2 dias
- Total: 9-11 dias

### Orçamento
- Assets: $5-10 (apenas Modern Interiors - Modern Office já temos)
- Sem custos adicionais de desenvolvimento
- Total significativamente menor que alternativas ($10-20)

---

## Dependências

### Sistemas Existentes (Manter)
- Scene.js (adaptar para top-down)
- Entity system (AgentEntity, DepartmentEntity)
- AnimationSystem (adaptar para top-down)
- MovementSystem (adaptar para jogador)
- InteractionSystem (expandir)
- StateSyncSystem (manter)
- TaskExecutionSystem (manter)

### Novos Sistemas (Criar)
- PlayerController (controle do jogador)
- PathfindingSystem (movimento inteligente)
- CameraController (seguir jogador)
- CollisionSystem (colisão com obstáculos)
- TopDownRenderer (renderização top-down)

---

## Success Criteria

### Critérios de Sucesso

1. **Jogabilidade**:
   - ✅ Jogador controlável com WASD/setas
   - ✅ Movimento suave e responsivo
   - ✅ Colisão funciona corretamente
   - ✅ Câmera segue jogador

2. **Visual**:
   - ✅ Escritório realista com Office Tileset
   - ✅ Departamentos claramente identificados
   - ✅ Agentes visíveis e animados
   - ✅ UI limpa e funcional

3. **Performance**:
   - ✅ 60 FPS em desktop
   - ✅ < 3s carregamento
   - ✅ Sem lag ou stuttering

4. **Funcionalidade**:
   - ✅ Contratar agentes funciona
   - ✅ Agentes trabalham visualmente
   - ✅ Interações funcionam
   - ✅ Integração com backend mantida

---

## Out of Scope (Futuro)

- Múltiplos andares
- Customização de escritório
- Modo multiplayer
- Sistema de economia complexo
- Minigames
- Diálogos com agentes
- Sistema de progressão de níveis

---

## Riscos

### Risco 1: Assets incompatíveis
**Probabilidade**: Baixa  
**Impacto**: Médio  
**Mitigação**: Validar assets antes de comprar, ter plano B

### Risco 2: Performance com muitos agentes
**Probabilidade**: Média  
**Impacto**: Alto  
**Mitigação**: Culling, sprite batching, LOD system

### Risco 3: Colisão complexa
**Probabilidade**: Média  
**Impacto**: Médio  
**Mitigação**: Usar grid-based collision, simplificar hitboxes

### Risco 4: Pathfinding lento
**Probabilidade**: Baixa  
**Impacto**: Médio  
**Mitigação**: Usar A* otimizado, cache de paths

---

## Próximos Passos

### 1. Aquisição de Assets
- [x] Modern Office Revamped v1.2 baixado
- [ ] Comprar Modern Interiors ($5-10) - https://limezu.itch.io/moderninteriors
- [ ] Organizar assets na estrutura do projeto
- [ ] Criar sprite atlases (JSON)
- [ ] Criar carpetes customizados (5 cores)

### 2. Desenvolvimento
- [ ] Criar design.md com arquitetura detalhada
- [ ] Criar tasks.md com plano de 9-11 dias
- [ ] Implementar sistemas (PlayerController, CameraFollow, etc.)
- [ ] Integrar assets do Modern Office
- [ ] Testar e refinar

### 3. Documentação
- [ ] Atualizar ASSET_CREDITS.md com créditos LimeZu
- [ ] Documentar uso dos assets
- [ ] Criar guia de customização

---

## Referências

### Documentos de Análise
- `MODERN_OFFICE_REVAMPED_ANALYSIS.md` - Análise técnica completa
- `DECISAO_FINAL_MODERN_OFFICE.md` - Resumo executivo em português
- `NOVO_PLANO_GAME_TOPDOWN.md` - Plano inicial top-down
- `ASSET_INVENTORY.md` - Pesquisa original de assets

### Assets
- Modern Office Revamped v1.2: `downloads/Modern_Office_Revamped_v1.2/`
- Modern Interiors: https://limezu.itch.io/moderninteriors
- LimeZu Portfolio: https://limezu.itch.io/

### Sistemas Existentes
- `.kiro/specs/v4-frontend-game-layer/` - Arquitetura atual do game layer
- `frontend/src/components/game/` - Implementação atual

---

## Aprovação

Este documento deve ser aprovado antes de prosseguir para o design e implementação.

**Status**: ✅ Atualizado com Modern Office Revamped v1.2  
**Data**: 2026-04-21  
**Versão**: 2.0 (atualizado com análise completa de assets)  
**Próximo Passo**: Aguardando aprovação do usuário para:
1. Comprar Modern Interiors ($5-10)
2. Criar design.md com arquitetura detalhada
3. Criar tasks.md com plano de implementação (9-11 dias)

**Mudanças da v1.0**:
- Substituído Office Interior Tileset por Modern Office Revamped v1.2
- Adicionado Modern Interiors para personagens
- Atualizado orçamento ($5-10 vs $10-20)
- Atualizado timeline (9-11 dias vs 8-10 dias)
- Adicionada seção de organização de assets
- Adicionadas referências aos documentos de análise

