
# 🎨 Repaginação Total do Design System — Glassmorphism Premium

## Filosofia
- **Menos é mais**: Remover ruído visual, reduzir cores competindo
- **Glassmorphism sutil**: Blur de fundo, bordas translúcidas, sem gradientes pesados
- **Tipografia respirada**: Hierarquia clara com espaçamento generoso
- **Consistência absoluta**: Um único vocabulário visual em todo o sistema

---

## Fase 1 — Fundação (CSS Variables + Tailwind)

### `index.css` — Nova paleta para Light e Dark
- **Light mode**: Fundo off-white (#FAFBFC), cards brancos com bordas sutis, texto grafite
- **Dark mode**: Fundo deep navy (#0B0F1A), cards com glass effect (white/5%), texto neve
- **Accent único**: Indigo suave (sem laranja, verde, amarelo gritantes)
- **Semânticos suaves**: Success/Warning/Destructive em tons pastel, não saturados
- Remover gradientes pesados (`--gradient-primary`, `--gradient-premium`)
- Novo sistema de sombras: `--shadow-sm/md/lg` com tom azulado sutil

### `tailwind.config.ts`
- Atualizar todas as cores para os novos tokens
- Adicionar `glass` utility class
- Ajustar `fontSize` base para melhor hierarquia

---

## Fase 2 — Componentes Core

### Cards (`card.tsx`)
- Background: `bg-card/80 backdrop-blur-xl border-white/10`
- Sombra suave ao invés de bordas pesadas
- Padding mais generoso (p-5 → p-6)

### Sidebar (`sidebar.tsx`)
- Glass effect no fundo
- Active state: pill suave com bg-primary/10 (sem shadow inset pesado)
- Ícones com opacidade reduzida quando inativos

### Buttons
- Menos variantes visíveis, mais sutileza
- Primary: sólido mas não gritante
- Ghost/Outline: bordas mais finas

### StatCards
- Remover sparklines visuais pesados
- Layout mais limpo: número grande + label + indicador sutil de mudança
- Sem gradientes de fundo

---

## Fase 3 — Dashboard Cleanup

### WelcomeHeroCard
- Simplificar: apenas saudação + data (remover stats duplicados do hero)
- Fundo glass sutil ao invés de gradientes

### YourDaySection
- Remover saudação duplicada
- Cards de urgência com bordas sutis coloridas (não fundo sólido)

### Tabs
- Mais espaçadas, estilo pill clean
- Active: bg sutil, sem sombras pesadas

---

## Fase 4 — Consistência Global

### Badges/Tags
- Tons pastel uniformes
- Sem bordas coloridas duplas (border + bg)

### Scores/Indicators
- Círculos mais finos, menos "pesados"
- Cores mais suaves

### Espaçamento
- Gap base: 6 (24px) entre seções
- Padding interno: 6 (24px) em cards
- Tipografia: text-sm base, text-xs para meta, text-lg para títulos
