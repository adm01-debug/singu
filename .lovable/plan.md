

# Plano: Seção em Configurações para ajustar pesos padrão do Score de Prontidão com escopo (global vs. somente esta tela)

## Estado atual

`useProntidaoWeightsStore` (Zustand + persist em `localStorage` chave `singu-prontidao-weights`) guarda os 4 pesos (`cadence`, `recency`, `sentiment`, `channel`) que alimentam o Score de Prontidão. O editor inline `ProntidaoWeightsEditor` (Popover com sliders) já existe e altera esses pesos ao vivo — porém é **único e global**: qualquer ajuste vale para todas as fichas, e não há um lugar em "Configurações" para definir um padrão e nem distinção entre "padrão global" e "override desta tela".

Não existe hoje conceito de **escopo** (global vs. local-da-tela) nem página de configuração dedicada.

## Objetivo

1. Criar uma seção "Score de Prontidão" em **Configurações** onde o usuário ajusta os **pesos padrão globais** (aplicados a todas as fichas por padrão).
2. Manter o editor inline na ficha (`ProntidaoWeightsEditor`) com um **toggle de escopo**: "Aplicar a todas as fichas" (atualiza o padrão global) vs. "Apenas nesta tela" (cria override só para o contato atual da sessão).
3. Override "apenas nesta tela" expira ao trocar de contato/recarregar — é intencional e leve (sessão de análise pontual). Padrão global persiste.

## Mudanças

### 1. Refatorar `useProntidaoWeightsStore`

Arquivo: `src/stores/useProntidaoWeightsStore.ts` (continua <80 linhas).

Novo shape:
```ts
interface State {
  defaultWeights: ProntidaoWeights;            // padrão global (persistido em localStorage)
  sessionOverride: { contactId: string; weights: ProntidaoWeights } | null; // não persistido
  setDefaultWeight: (key, value) => void;
  setSessionOverrideWeight: (contactId, key, value) => void;
  clearSessionOverride: () => void;
  resetDefaults: () => void;
}
```

`persist` middleware com `partialize` para gravar **apenas** `defaultWeights` (mesma chave `singu-prontidao-weights` — migração transparente: se ler shape antigo `{ weights }`, mover para `defaultWeights`).

Novo seletor exportado: `useEffectiveProntidaoWeights(contactId?: string): ProntidaoWeights` — retorna `sessionOverride.weights` se `sessionOverride.contactId === contactId`, senão `defaultWeights`. Consumidores do score (cards/widgets que hoje leem `weights`) passam a usar este seletor com o `contactId` da ficha em foco.

### 2. Atualizar consumidores existentes

- Trocar `useProntidaoWeightsStore(s => s.weights)` por `useEffectiveProntidaoWeights(contactId)` em todos os locais (provavelmente `lib/prontidaoScore.ts` callers, ScoreProntidaoCard, etc. — confirmar via search).
- Onde o `contactId` não estiver disponível (raríssimo para esse score), usar `defaultWeights`.

### 3. Atualizar `ProntidaoWeightsEditor`

Arquivo: `src/components/ficha-360/ProntidaoWeightsEditor.tsx` (~+40 linhas, segue <180).

- Receber prop `contactId: string`.
- Adicionar `RadioGroup` (ou `Tabs` compactas) no topo do popover: 
  - **"Aplicar a todas as fichas"** (default — escreve em `defaultWeights`)
  - **"Apenas nesta tela"** (escreve em `sessionOverride` para o `contactId`)
- Sliders mudam o alvo conforme o escopo selecionado. Estado inicial do escopo: "Apenas nesta tela" se já houver `sessionOverride` para esse contato, senão "Aplicar a todas as fichas".
- Botão "Restaurar padrão" passa a ter dois comportamentos contextuais: no escopo global → `resetDefaults()`; no escopo local → `clearSessionOverride()`.
- Badge "Total" e dica "essas mudanças aplicam ao vivo" mantidos. Nova legenda discreta abaixo do radio explicando: "O padrão vale para todas as fichas. O override desta tela é temporário e termina ao trocar de contato."

### 4. Nova página/seção de Configurações

Identificar onde fica "Configurações" (provável `src/pages/Configuracoes.tsx` ou similar — pesquisar). Adicionar uma nova seção/aba **"Score de Prontidão"** com:

- Título + descrição curta.
- Mesmos 4 sliders (`Cadência`, `Recência`, `Sentimento`, `Canal`) operando direto sobre `defaultWeights` via `setDefaultWeight`.
- Badge total + botão "Restaurar padrões".
- Texto explicativo: "Estes pesos definem o cálculo do Score de Prontidão para todas as fichas. Você pode sobrescrever pontualmente em uma ficha específica usando o ícone de ajuste no card de score."

Componente novo `src/components/settings/ProntidaoDefaultsSection.tsx` (~120 linhas) reutilizando `Slider`, `Badge`, `Button` (sem duplicar lógica do popover — apenas escreve em `defaultWeights`).

Se não houver página "Configurações" preexistente apropriada, criar `src/pages/Configuracoes.tsx` minimalista com essa seção e adicionar rota `/configuracoes` + entrada na sidebar (seção "Sistema") — confirmar via exploração antes de assumir.

### 5. Sem mudanças em `lib/prontidaoScore.ts`

Continua puro. Apenas seus callers mudam para passar os pesos efetivos.

## Critérios de aceite

(a) `useProntidaoWeightsStore` separa `defaultWeights` (persistidos) de `sessionOverride` (efêmero, por contactId), com migração transparente da chave antiga; (b) novo seletor `useEffectiveProntidaoWeights(contactId)` retorna o override se aplicável, senão o padrão; (c) `ProntidaoWeightsEditor` no popover da ficha ganha radio "Aplicar a todas as fichas" / "Apenas nesta tela", com estado inicial inteligente e botão de reset contextual; (d) Configurações ganha seção "Score de Prontidão" que edita o padrão global, com descrição clara do escopo; (e) trocar de contato limpa o escopo "apenas nesta tela" daquele contato anterior (não vaza override entre fichas); (f) cards/widgets que mostram o score consomem o seletor efetivo e refletem mudanças ao vivo nos dois escopos; (g) sem nova dependência, sem `any`, PT-BR; (h) cada arquivo permanece <200 linhas; nenhum tem regressão visual além das adições previstas; (i) acessibilidade: radio de escopo com `aria-label` e legenda associada; sliders mantêm `aria-label` por fator.

