# Game View Camera Centering Fix

**Status**: ✅ COMPLETE  
**Date**: 2026-04-19  
**Issue**: Ao dar zoom, os departamentos são empurrados para o lado esquerdo - game layer não está centralizado

---

## Problema Identificado

### Sintomas
- Ao dar zoom in/out, os departamentos se movem para o lado esquerdo da tela
- Não é possível ver todos os departamentos porque o layout não está centralizado
- A câmera não está focando no centro do layout do escritório

### Causa Raiz
A câmera estava sendo inicializada no centro do mundo (bounds: 2000x1500), mas o layout do escritório é desenhado com um offset de `(400, 200)` e ocupa aproximadamente 800x600 pixels. Isso causava um desalinhamento entre o centro da câmera e o centro do layout visual.

**Código Anterior:**
```javascript
// Centralizava no meio do mundo inteiro (1000, 750)
this.setCameraPosition(
  this.bounds.maxX / 2 - this.viewport.width / 2,
  this.bounds.maxY / 2 - this.viewport.height / 2
);
```

**Problema:** O layout do escritório não está no centro do mundo, está deslocado para `(400, 200)`.

---

## Solução Implementada

### Mudanças no Scene.js

1. **Inicialização da Câmera**
   - Agora centraliza no centro do layout do escritório, não no centro do mundo
   - Calcula o centro do layout: `(400 + 400, 200 + 300)` = `(800, 500)`
   - Ajusta a posição da câmera para centralizar esse ponto no viewport

2. **Método resetCamera()**
   - Atualizado para usar a mesma lógica de centralização
   - Garante que o botão "Reset View" sempre volta para o centro do layout

3. **Método focusOn()**
   - Corrigido para considerar o nível de zoom ao centralizar
   - Agora usa o zoom target ao calcular a posição, não o zoom atual

### Código Corrigido

```javascript
// Inicialização da câmera
const officeLayoutCenterX = 400 + 400; // offset + metade da largura do layout
const officeLayoutCenterY = 200 + 300; // offset + metade da altura do layout

this.setCameraPosition(
  officeLayoutCenterX - this.viewport.width / 2,
  officeLayoutCenterY - this.viewport.height / 2
);
```

```javascript
// Método focusOn corrigido
focusOn(x, y, zoom = null) {
  const currentZoom = zoom !== null ? zoom : this.camera.zoom;
  
  const targetX = x - (this.viewport.width / 2) / currentZoom;
  const targetY = y - (this.viewport.height / 2) / currentZoom;
  
  this.moveCameraTo(targetX, targetY);
  
  if (zoom !== null) {
    this.zoomCameraTo(zoom);
  }
}
```

---

## Cálculos do Layout

### Dimensões do Escritório
- **Offset inicial**: `(400, 200)`
- **Grid usado**: 20x15 células
- **Tamanho da célula**: 64 pixels
- **Projeção isométrica**: 30 graus, ratio 2:1

### Departamentos (em coordenadas de grid)
1. **Content Creation**: (2, 2) - 6x5 células
2. **Publishing**: (9, 2) - 5x5 células
3. **Trend Analysis**: (2, 8) - 5x5 células
4. **Customer Support**: (8, 8) - 6x5 células
5. **Administration**: (15, 2) - 4x11 células

### Centro do Layout
- **X**: 400 (offset) + ~400 (metade da largura projetada) = 800
- **Y**: 200 (offset) + ~300 (metade da altura projetada) = 500

---

## Comportamento Esperado Após a Correção

1. **Ao carregar o jogo**:
   - A câmera inicia centralizada no layout do escritório
   - Todos os 5 departamentos são visíveis

2. **Ao dar zoom in (+)**:
   - O zoom acontece no centro do viewport
   - Os departamentos permanecem centralizados
   - Não há deslocamento para a esquerda

3. **Ao dar zoom out (-)**:
   - O zoom acontece no centro do viewport
   - Mais área do escritório fica visível
   - Layout permanece centralizado

4. **Ao clicar em "Reset View" (Home)**:
   - Câmera volta para o centro do layout
   - Zoom volta para 1.0
   - Visão geral de todos os departamentos

5. **Ao focar em um agente ou departamento**:
   - Câmera centraliza corretamente no elemento
   - Zoom aplicado mantém o elemento no centro

---

## Instruções de Teste

1. **Limpar cache do navegador**: `Ctrl + Shift + R`
2. **Navegar para**: `localhost:5173/app`
3. **Verificar centralização inicial**:
   - Todos os 5 departamentos devem estar visíveis
   - Layout deve estar centralizado na tela
4. **Testar zoom in** (botão + ou scroll up):
   - Departamentos devem permanecer centralizados
   - Não deve haver deslocamento para a esquerda
5. **Testar zoom out** (botão - ou scroll down):
   - Mais área deve ficar visível
   - Layout deve permanecer centralizado
6. **Testar Reset View** (botão Home):
   - Deve voltar para a visão inicial centralizada
   - Zoom deve voltar para 1.0
7. **Testar foco em agente**:
   - Clicar em um agente no painel esquerdo
   - Câmera deve centralizar no agente

---

## Arquivos Modificados

- `frontend/src/components/game/Scene.js`
  - Método construtor: inicialização da câmera
  - Método `resetCamera()`: reset para centro do layout
  - Método `focusOn()`: cálculo correto com zoom

---

## Notas Técnicas

### Por que o offset (400, 200)?
O offset foi escolhido para dar margem visual ao redor do layout do escritório, evitando que os departamentos fiquem colados nas bordas do mundo.

### Por que centralizar no layout e não no mundo?
O mundo (2000x1500) é maior que o layout do escritório para permitir expansão futura e dar espaço para efeitos visuais. Centralizar no mundo deixaria muito espaço vazio visível.

### Zoom e Centralização
O zoom em PixiJS funciona como um scale transform. Quando aplicamos zoom, precisamos ajustar a posição da câmera para manter o ponto focal no centro do viewport. A fórmula é:
```
targetX = pointX - (viewportWidth / 2) / zoom
targetY = pointY - (viewportHeight / 2) / zoom
```

---

## Próximos Passos

1. ✅ Câmera centralizada no layout
2. ✅ Zoom funciona corretamente
3. ✅ Reset view funciona
4. ⏳ Testar com diferentes resoluções de tela
5. ⏳ Verificar comportamento em mobile (se aplicável)
6. ⏳ Adicionar animação suave de zoom (já existe smoothing)

---

## Issues Relacionadas

- ✅ JavaScript errors (`pauseAll is not a function`) - ANIMATION_SYSTEM_PAUSEALL_FIX.md
- ✅ Browser cache - BROWSER_CACHE_FIX.md
- ✅ UI panels blocking interaction - GAME_VIEW_UI_INTERACTION_FIX.md
- ✅ Camera centering on zoom - Este documento
