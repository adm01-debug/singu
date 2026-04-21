
# Plano: Score de Prontidão na Ficha 360

## Objetivo

Calcular um **Score de Prontidão (0–100)** para o contato — indicando o quão "pronto" ele está para uma próxima abordagem comercial agora — e exibir um card dedicado no topo da Ficha 360 com a nota, badge de nível, breakdown dos 4 fatores e uma recomendação textual gerada localmente.

## Reutilização (zero novo fetch)

Todos os sinais já estão disponíveis na Ficha 360 atual:

| Fator | Peso | Fonte (já carregada) |
|---|---|---|
| **Cadência** (em dia vs atrasado) | 30% | `profile.cadence_days` + `profile.last_contact_at` (`useContactView360`) |
| **Recência** (última interação) | 30% | `profile.last_contact_at` |
| **Sentimento** | 25% | `profile.sentiment` + `intelligence.sentiment` fallback |
| **Melhor canal definido** | 15% | `intelligence.best_channel` + `intelligence.best_time` |

Sem novas queries, sem nova edge function, sem novo schema. Cálculo 100% client-side via `useMemo`.

## Arquitetura

```text
Ficha 360
 └─ Topo (após header)
     └─ ScoreProntidaoCard  (NOVO, full width)
         ├─ Score circular grande (0-100) + nível (Frio/Morno/Quente/Pronto)
         ├─ Breakdown horizontal: 4 mini-barras (Cadência/Recência/Sentimento/Canal)
         └─ Recomendação textual contextual + CTA "Próxima ação sugerida"
```

## Implementação

### 1. Lib de cálculo `src/lib/prontidaoScore.ts` (≤180 linhas)

Função pura `computeProntidaoScore({ profile, intelligence })`:

```ts
interface ProntidaoBreakdown {
  cadence: { score: number; weight: 30; label: string; status: 'good'|'warn'|'bad'|'unknown' }
  recency: { score: number; weight: 30; label: string; status: ... }
  sentiment: { score: number; weight: 25; label: string; status: ... }
  channel: { score: number; weight: 15; label: string; status: ... }
}

interface ProntidaoResult {
  score: number              // 0-100 ponderado
  level: 'frio'|'morno'|'quente'|'pronto'
  breakdown: ProntidaoBreakdown
  recommendation: string     // texto PT-BR contextual
  nextActionHint: string     // ex: "Ligar pela manhã via WhatsApp"
}
```

**Regras de cálculo (cada fator 0–100):**

- **Cadência**: razão `lastDays / cadence_days`
  - ≤1.0 → 100 · ≤1.5 → 60 · ≤2.0 → 30 · >2.0 → 10 · sem dado → 50
- **Recência**: dias desde última interação
  - ≤3d → 100 · ≤7d → 80 · ≤14d → 60 · ≤30d → 40 · ≤60d → 20 · >60d → 5
- **Sentimento**: positive→100 · neutral→60 · mixed→50 · negative→20 · null→50
- **Canal**: ambos (best_channel + best_time)→100 · só um→60 · nenhum→30

**Nível:** `≥75 pronto` · `≥55 quente` · `≥35 morno` · `<35 frio`

**Recomendação:** template PT-BR baseado no fator mais fraco e no melhor canal. Ex.:
- *"Atrasado em 12 dias na cadência. Reabra a conversa com WhatsApp pela manhã, recapitulando o último ponto."*
- *"Contato quente — sentimento positivo recente. Avance para próxima etapa: agende reunião."*

### 2. Componente `ScoreProntidaoCard.tsx` (≤180 linhas)

`src/components/ficha-360/ScoreProntidaoCard.tsx`

- **Layout grid:** Esquerda (1/3) score circular + badge de nível · Direita (2/3) breakdown + recomendação
- **Score circular:** SVG simples (não nova lib) com cor semântica por nível (success/warning/destructive)
- **Breakdown:** 4 linhas com `Progress`, ícone (Calendar/Clock/Smile/Radio), label e valor
- **Recomendação:** card interno com ícone Lightbulb + texto + botão "Sugerir próxima ação" (reutiliza dialog/edge function `suggest-next-action` que já existe — opcional, sem bloqueio)
- `React.memo`, tokens semânticos, flat design, PT-BR

### 3. Integração em `Ficha360.tsx`

- Importar `computeProntidaoScore` e `ScoreProntidaoCard`
- Calcular via `useMemo(() => computeProntidaoScore({ profile, intelligence }), [profile, intelligence])`
- Renderizar `<ScoreProntidaoCard data={prontidao} />` logo após o header da página, antes do grid de cards existentes
- Skeleton enquanto `isLoading`

### 4. Padrões obrigatórios

- PT-BR em todo texto/recomendação
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` defensivo
- Tokens semânticos (Nexus Blue + success/warning/destructive)
- Flat design, sem sombras/gradientes
- Função pura testável (sem side effects)

## Arquivos tocados

**Novos (2):**
- `src/lib/prontidaoScore.ts` — função pura de cálculo
- `src/components/ficha-360/ScoreProntidaoCard.tsx` — card visual

**Editados (1):**
- `src/pages/Ficha360.tsx` — incluir card no topo

## Critério de fechamento

(a) Card de Prontidão visível no topo da Ficha 360, (b) score 0–100 calculado a partir dos 4 fatores ponderados, (c) badge de nível (Frio/Morno/Quente/Pronto) com cor semântica, (d) breakdown dos 4 fatores com barras, (e) recomendação textual em PT-BR contextual ao fator mais fraco, (f) zero novas queries de rede, (g) zero regressão nos demais cards.
