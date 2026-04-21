
# Plano: Pesos personalizáveis do Score de Prontidão com recálculo ao vivo

## Contexto

`computeProntidaoScore` usa pesos hardcoded por fator (cadência 30, recência 30, sentimento 25, canal 15). É pura e recalcula sempre que entradas mudam. Falta: (a) parametrizar os pesos, (b) UI para o usuário ajustar e (c) persistência por usuário com recálculo instantâneo na Ficha 360.

## Decisão de armazenamento

Usar **Zustand com persist em localStorage** (padrão já usado em `useUIStore`). Justificativa: zero rede, recálculo síncrono ao vivo, preferência puramente visual/de leitura sem precisar sincronizar entre dispositivos. Coerente com a memória de "client-side fast feedback" e mantém as 4 regras de "zero novas queries".

## Implementação

### 1. `src/lib/prontidaoScore.ts` — parametrizar pesos

- Exportar `DEFAULT_PRONTIDAO_WEIGHTS = { cadence: 30, recency: 30, sentiment: 25, channel: 15 }` e tipo `ProntidaoWeights`.
- Adicionar parâmetro opcional `weights?: ProntidaoWeights` em `ComputeInput` (default = DEFAULT).
- Substituir os literais 30/30/25/15 dentro de `scoreCadence/Recency/Sentiment/Channel` por valores recebidos via parâmetro (passar `weights[key]` ao construir cada `ProntidaoFactor`).
- Em `computeProntidaoScore`, usar `weights` recebido (com fallback ao DEFAULT) ao montar o breakdown e o cálculo ponderado.
- Sanitizar: se soma = 0, cair no DEFAULT (proteção).

### 2. Novo store: `src/stores/useProntidaoWeightsStore.ts` (~40 linhas)

```ts
interface State {
  weights: ProntidaoWeights;
  setWeight: (key: keyof ProntidaoWeights, value: number) => void;
  reset: () => void;
}
```
- `create<State>()(persist(..., { name: 'singu-prontidao-weights' }))`.
- `setWeight` clampa 0–100.
- `reset` volta ao DEFAULT.

### 3. Novo componente: `src/components/ficha-360/ProntidaoWeightsEditor.tsx` (~140 linhas)

- `Popover` (gatilho: ícone `Sliders` ghost-button discreto no canto superior direito do `ScoreProntidaoCard`, ao lado do badge de nível).
- Conteúdo do popover (~320px):
  - Título: "Personalizar pesos do score"
  - Subtítulo: "Ajuste a importância de cada fator. As mudanças aplicam ao vivo."
  - 4 linhas com `Slider` (0–60, step 5) + label PT-BR + valor numérico:
    - Cadência · Recência · Sentimento · Canal preferido
  - Indicador da soma total: `"Total: {soma}%"` em badge (não precisa somar 100 — a função já normaliza por totalWeight).
  - Botões rodapé: `Restaurar padrão` (ghost) + `Fechar` (default).
- `React.memo`, tokens semânticos, flat.

### 4. `src/components/ficha-360/ScoreProntidaoCard.tsx` — integrar editor

- Adicionar gatilho `<ProntidaoWeightsEditor />` no header da coluna direita (acima dos sliders dos fatores), discreto.
- Sem outras mudanças visuais.

### 5. `src/pages/Ficha360.tsx` — usar pesos do store

- `const weights = useProntidaoWeightsStore(s => s.weights);`
- `useMemo(() => computeProntidaoScore({ profile, intelligence, weights }), [profile, intelligence, weights]);`
- Mudança no slider → store atualiza → `useMemo` recalcula → ring + breakdown + recomendação se atualizam ao vivo.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow/gradient)
- `React.memo` no editor
- Zero novas queries de rede (puramente local)
- Persistência em localStorage (`singu-prontidao-weights`)
- Backward compat: `computeProntidaoScore` sem `weights` continua funcionando idêntico

## Arquivos tocados

**Criados (2):**
- `src/stores/useProntidaoWeightsStore.ts`
- `src/components/ficha-360/ProntidaoWeightsEditor.tsx`

**Editados (3):**
- `src/lib/prontidaoScore.ts` — parametrizar pesos com fallback DEFAULT
- `src/components/ficha-360/ScoreProntidaoCard.tsx` — montar gatilho do editor
- `src/pages/Ficha360.tsx` — ler pesos do store e passar para `computeProntidaoScore`

## Critério de fechamento

(a) Ícone `Sliders` aparece no `ScoreProntidaoCard` e abre popover com 4 sliders rotulados em PT-BR, (b) mover qualquer slider atualiza ring/breakdown/recomendação na hora sem recarregar dados, (c) "Restaurar padrão" volta a 30/30/25/15, (d) preferência persiste em localStorage e sobrevive a refresh, (e) `WhyScoreDrawer` e o `ProximaAcaoCTA` continuam funcionando com os novos pesos refletidos no breakdown, (f) `computeProntidaoScore` chamado sem `weights` mantém comportamento original (zero regressão), (g) zero novas queries de rede, (h) PT-BR, tokens semânticos, flat.
