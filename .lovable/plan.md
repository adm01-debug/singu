

# Plano: Ordenação por criticidade + badge "Bem tratada" no spotlight

## Diagnóstico

- `ObjectionsSpotlight` já ordena por `unhandled*2 + count` (regra atual no `useMemo` de `top`). ✅
- Já existe `SEVERITY_STYLES` com label por severidade (Crítica/Atenção/Bem tratada) renderizado como badge ao lado da categoria.
- Quando `unhandled === 0`, a severidade já cai em "well-handled" e o badge mostra "Bem tratada", mas a label e o destaque visual podem ser reforçados para 100%.

## O que será construído

1. **Garantir ordenação explícita por criticidade**: manter `unhandled*2 + count` desc, com desempate determinístico por `count` desc → `objection` asc (evita ordem instável quando scores empatam).
2. **Badge "Bem tratada" reforçado**: quando `rate === 100` (todas tratadas), o badge de severidade exibe "Bem tratada" com ícone `CheckCircle2` inline + variant `success` (em vez de `outline` colorido), tornando o destaque visual inequívoco. Mantém o card mesmo com 100% para celebrar o bom tratamento.

## Mudanças

### `src/components/interactions/insights/ObjectionsSpotlight.tsx`
- No `useMemo` de `top`: adicionar desempate `(b.score - a.score) || (b.o.count - a.o.count) || a.o.objection.localeCompare(b.o.objection, "pt-BR")`.
- No `ObjectionCard`: quando `rate === 100`, renderizar o badge de severidade com `variant="success"` + ícone `CheckCircle2` (h-3 w-3) inline, label "Bem tratada". Para os demais casos, manter o badge `outline` atual com a label da severidade.
- Sem mudanças em hooks, tipos, agregações ou outros componentes.

## Critérios de aceite

(a) Spotlight mostra até 3 objeções ordenadas por `unhandled*2 + count` desc, com desempate por `count` desc e nome asc (ordem estável); (b) quando `rate === 100`, o card exibe badge `success` "Bem tratada" com ícone de check inline, visualmente distinto do badge outline das outras severidades; (c) cards com `unhandled > 0` continuam com badge "Crítica" ou "Atenção" no estilo atual; (d) PT-BR, flat, sem novas dependências; (e) arquivo permanece ≤300 linhas; (f) sem `any`; (g) sem regressão na ordenação, no botão "Ver resposta completa", no "Copiar resposta" ou no bloco de confirmação verde inferior.

