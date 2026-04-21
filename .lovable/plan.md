

# Plano: Reposicionar spotlight acima do ranking de objeções

## Diagnóstico

- Em `InsightsPanel.tsx`, hoje renderizam-se `ObjectionsRanking` (lista completa) e `ObjectionsSpotlight` (top 3 destaque) na aba Insights de `/interacoes`.
- Ordem atual coloca o ranking antes (ou ao lado) do spotlight, divergindo do critério de destaque visual.

## O que será construído

Reordenar a renderização dentro da seção de objeções no `InsightsPanel.tsx` para que o **spotlight** apareça **acima** do **ranking completo**, mantendo o ranking integralmente abaixo, sem qualquer alteração de comportamento, props ou estilos dos dois componentes.

## Mudanças

### `src/components/interactions/insights/InsightsPanel.tsx`
- Localizar a seção que renderiza objeções e garantir a ordem: `ObjectionsSpotlight` primeiro, `ObjectionsRanking` em seguida (mesmo container/card já existente, sem mudar wrappers, títulos ou espaçamentos globais).
- Caso os dois estejam em colunas/grids diferentes, unificar para uma coluna vertical onde spotlight precede o ranking; se já estão verticais, apenas trocar a ordem de renderização.
- Não alterar props, hooks (`useInteractionsInsights`), tipos ou os arquivos `ObjectionsSpotlight.tsx` / `ObjectionsRanking.tsx`.

## Critérios de aceite

(a) Na aba Insights de `/interacoes`, o card "Objeções em destaque" (spotlight, top 3) é renderizado **imediatamente acima** do ranking completo de objeções; (b) o ranking completo permanece visualmente e funcionalmente idêntico (mesmas linhas, badges, barras, ordenação interna); (c) sem mudanças em hooks, tipos, agregações ou nos arquivos dos dois componentes; (d) sem novas dependências; (e) PT-BR, flat, sem regressão de espaçamento ou responsividade nas demais seções da aba Insights; (f) `InsightsPanel.tsx` permanece dentro do limite de 400 linhas.

