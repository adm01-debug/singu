

# Plano: Exibir direção de impacto (positivo/negativo/neutro) por fator no WhyScoreDrawer

## Estado atual

`WhyScoreDrawer.tsx` mostra para cada fator: label, score/100, peso%, contribuição, duas barras e `detail` (texto livre). Falta um sinal **visual e semântico** indicando se aquele fator está **ajudando** (puxa o score pra cima), **prejudicando** (puxa pra baixo) ou é **neutro**. Hoje o usuário tem que inferir pela barra colorida (band) — pouco claro.

## Mudanças

Único arquivo: `src/components/intelligence/WhyScoreDrawer.tsx`. API pública preservada (campo opcional, não-quebrante).

### 1. Schema: campo opcional `direction` em `WhyScoreFactor`

```ts
export interface WhyScoreFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail?: string;
  direction?: 'positive' | 'negative' | 'neutral'; // NOVO opcional
}
```

Backwards-compatible: consumidores existentes (`ScoreProntidaoCard`, `LeadScoreBadge`, `DealRiskDrawer`, etc.) continuam funcionando sem mudanças.

### 2. Inferência automática quando `direction` não vier

Helper `inferDirection(score: number): Direction`:
- `score >= 65` → `'positive'`
- `score <= 35` → `'negative'`
- caso contrário → `'neutral'`

No `useMemo` que monta `rankedFactors`, computar `effectiveDirection = f.direction ?? inferDirection(f.score)`.

### 3. Mapa visual `DIRECTION_META`

```ts
const DIRECTION_META = {
  positive: {
    icon: TrendingUp,
    label: 'favorece',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    verb: 'Está ajudando',
  },
  negative: {
    icon: TrendingDown,
    label: 'prejudica',
    badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    verb: 'Está prejudicando',
  },
  neutral: {
    icon: Minus,
    label: 'neutro',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    verb: 'Impacto neutro',
  },
};
```

Importar `TrendingUp, TrendingDown, Minus` de `lucide-react`.

### 4. Renderização no card de cada fator

Próximo ao label (mesma linha dos badges de rank), adicionar um pequeno chip de direção:

```tsx
<Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 gap-1', meta.badgeClass)}>
  <DirIcon className="h-2.5 w-2.5" aria-hidden="true" />
  {meta.label}
</Badge>
```

Aria-label do badge: `"Este fator ${meta.verb.toLowerCase()} o score"`.

E no parágrafo de contribuição existente, prefixar com o verbo:
- positivo: `"Está ajudando: contribuição X pts (Y% do total)"`
- negativo: `"Está prejudicando: contribuição X pts (Y% do total)"`
- neutro: mantém atual `"Contribuição: X pts (Y% do total)"`

### 5. Resumo no topo da lista

Acima dos cards de fator, adicionar uma micro-legenda contando quantos puxam pra cada lado:

```
✓ 2 favorecendo  ✗ 1 prejudicando  · 1 neutro
```

Cada item com ícone e cor correspondente; só renderiza categorias com `count > 0`. Texto pequeno (`text-[11px] text-muted-foreground`), serve como visão geral antes do detalhe.

### 6. Tooltip do header atualizado

Trocar texto do tooltip do header para:
> "Ordenados pela contribuição real (peso × score). Cada fator mostra se está favorecendo, prejudicando ou neutro em relação ao score total."

### 7. Nada muda em consumidores

Nenhum consumidor precisa passar `direction` — a inferência por score cobre o caso padrão. Quem quiser sobrescrever (ex.: `ScoreProntidaoCard` poderia marcar "recência baixa" como `negative` mesmo com score médio) pode passar explicitamente em rodada futura.

## Critérios de aceite

(a) Cada fator exibe chip de direção (favorece / prejudica / neutro) ao lado do label, com ícone (`TrendingUp`/`TrendingDown`/`Minus`) e cor semântica (verde/vermelho/cinza); (b) quando `direction` não vier no payload, é inferida do score (≥65 positivo, ≤35 negativo, resto neutro); (c) parágrafo de contribuição ganha prefixo verbal ("Está ajudando" / "Está prejudicando") quando aplicável; (d) acima da lista aparece resumo `✓ N favorecendo · ✗ N prejudicando · N neutro` mostrando só categorias não-vazias; (e) tooltip do header explica o conceito de direção; (f) `WhyScoreFactor.direction` é opcional — consumidores existentes seguem funcionando sem alteração; (g) `aria-label` no chip descreve o impacto para leitores de tela; (h) sem nova dependência (lucide já tem os ícones), sem `any`, PT-BR; (i) arquivo permanece <280 linhas.

