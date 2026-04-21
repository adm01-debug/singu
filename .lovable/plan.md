
# Plano: Tela "Ficha 360" da Pessoa

## Objetivo

Criar uma rota dedicada `/contatos/:id/ficha-360` que consolida em **uma única tela vertical scrollável** todos os sinais de uma pessoa: perfil, tags de interesse, frequência de contato, últimas interações e links para conversas relacionadas.

## Reutilização (não reinventar)

O projeto já tem uma página rica `ContatoDetalhe.tsx` com abas. A Ficha 360 **NÃO substitui** isso — é uma visão **compacta, executiva, single-scroll**, ideal para preparação rápida antes de uma ligação/reunião. Reutiliza hooks e componentes maduros:

- `useContactView360` — visão consolidada (score, stage, sentiment, cadência, last/next contact)
- `useContactIntelligence` — churn risk, melhor canal, NPS
- `useExternalInteractions` — últimas interações com canal/direção/resumo
- `useRapportPoints` + `useRapportIntel` — interesses, hobbies, valores
- `useBestContactTime` — heatmap de melhor horário
- `getContactBehavior` — DISC/VAK/metaprogramas

## Arquitetura da tela

```text
/contatos/:id/ficha-360
 ├─ Header sticky: avatar grande + nome + cargo/empresa + 3 KPI chips
 │   (Score, Stage, Sentiment) + botões: Ver Detalhe Completo, Voltar
 │
 ├─ Grid 2 colunas (desktop) / 1 coluna (mobile):
 │
 │   COLUNA ESQUERDA (perfil):
 │   ├─ Card "Perfil Comportamental"
 │   │   DISC primário/secundário + EQ level + confiança
 │   ├─ Card "Tags de Interesse"
 │   │   Chips: hobbies + interesses + valores + frequent_words
 │   │   (de useRapportIntel + useRapportPoints)
 │   └─ Card "Dados Pessoais Relevantes"
 │       Aniversário, família, anchors positivos
 │
 │   COLUNA DIREITA (atividade):
 │   ├─ Card "Frequência de Contato"
 │   │   - Cadência configurada (X dias)
 │   │   - Último contato (há Y dias) — semáforo verde/amarelo/vermelho
 │   │   - Próximo contato sugerido
 │   │   - Total de interações + média/mês
 │   │   - Mini-stat: melhor canal + melhor horário
 │   └─ Card "Últimas 10 Interações"
 │       Lista compacta com ícone canal + assunto + data + sentiment dot
 │       Cada item clicável → /interacoes?contact=<id>&open=<interactionId>
 │
 └─ Card "Conversas Relacionadas" (full-width)
     Grid de chips/links rápidos:
     - "Ver todas as conversas" → /interacoes?contact=<id>
     - "WhatsApp" → /interacoes?contact=<id>&canal=whatsapp
     - "Emails" → /interacoes?contact=<id>&canal=email
     - "Ligações" → /interacoes?contact=<id>&canal=call
     - "Reuniões" → /interacoes?contact=<id>&canal=meeting
     - "Timeline cronológica" → /interacoes?tab=timeline
     Contador ao lado de cada chip
```

## Implementação

### 1. Novo hook agregador `useFicha360`
Arquivo: `src/hooks/useFicha360.ts`
- Combina internamente: `useContactView360` + `useContactIntelligence` + `useExternalInteractions(limit=10)` + `useRapportIntel` + `useRapportPoints`
- Retorna `{ profile, intelligence, recentInteractions, rapportIntel, rapportPoints, channelCounts, isLoading }`
- Calcula client-side `channelCounts` agrupando `recentInteractions` por canal
- Sem `useEffect` — composição de TanStack Queries

### 2. Página `Ficha360.tsx`
Arquivo: `src/pages/Ficha360.tsx` (≤300 linhas)
- Layout via `AppLayout`, `SEOHead`, `Header` com botão voltar
- Header sticky com avatar + KPIs (score, stage, sentiment)
- Grid responsivo `lg:grid-cols-2`
- Skeleton loading granular por card
- Tratamento de erro com `EmptyState`

### 3. Subcomponentes (≤150 linhas cada)
- `src/components/ficha-360/PerfilComportamentalCard.tsx`
- `src/components/ficha-360/TagsInteresseCard.tsx` — chips agrupados por origem (hobbies/valores/palavras frequentes)
- `src/components/ficha-360/FrequenciaContatoCard.tsx` — semáforo de saúde + KPIs
- `src/components/ficha-360/UltimasInteracoesCard.tsx` — lista compacta clicável
- `src/components/ficha-360/ConversasRelacionadasCard.tsx` — chips de navegação contextual

### 4. Rota e navegação
- Adicionar rota `/contatos/:id/ficha-360` em `AppRoutes.tsx` com lazy load
- Adicionar botão "Ficha 360" no header de `ContatoDetalhe.tsx` para acesso rápido
- Adicionar item no menu de ações da `ContactCard` (lista de contatos)

### 5. Padrões obrigatórios
- PT-BR em todos os textos
- `Array.isArray()` antes de iterar
- Sem `any`, sem `dangerouslySetInnerHTML`
- Cores via tokens semânticos (Nexus Blue, success/warning/destructive)
- Flat design — sem sombras/gradientes
- Memoização: `React.memo` nos 5 cards
- Mobile-first: stack em 1 coluna <lg

## Arquivos tocados

**Novos (7):**
- `src/hooks/useFicha360.ts`
- `src/pages/Ficha360.tsx`
- `src/components/ficha-360/PerfilComportamentalCard.tsx`
- `src/components/ficha-360/TagsInteresseCard.tsx`
- `src/components/ficha-360/FrequenciaContatoCard.tsx`
- `src/components/ficha-360/UltimasInteracoesCard.tsx`
- `src/components/ficha-360/ConversasRelacionadasCard.tsx`

**Editados (2):**
- `src/AppRoutes.tsx` (nova rota lazy)
- `src/pages/ContatoDetalhe.tsx` (botão "Ficha 360" no header)

## Critério de fechamento

(a) Rota `/contatos/:id/ficha-360` acessível e renderizando em <2s, (b) 5 cards populados com dados reais (com fallback gracioso por card), (c) chips de "Conversas Relacionadas" navegam para `/interacoes` com filtros corretos pré-aplicados, (d) últimas interações clicáveis abrem o item na lista, (e) responsivo mobile (1 coluna) e desktop (2 colunas), (f) zero regressão em `ContatoDetalhe.tsx`.
