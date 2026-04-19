
As 8 melhorias do plano anterior já foram entregues na última iteração (skeletons intel, filtros URL no Graph, breadcrumb + drill-in no Entity 360, heatmap + CSV no CrossRef, ⌘K + histórico + comandos no Ask, a11y, status bar, animações). Para continuar rumo ao 10/10, proponho a **Rodada 2** — 8 novas melhorias atômicas, cada uma com excelência, sem pausas.

# Rodada 2 — Intelligence Hub

**1. Persistência de aba ativa em URL** — `?tab=graph|entity|crossref|ask` via `useSearchParams`. Permite deep-link e refresh sem perder contexto.

**2. Empty states ricos** — substituir os "── NO_DATA ──" genéricos por componente `IntelEmptyState` com ícone, título, descrição e CTA contextual (ex: "Buscar contato" no Entity 360 vazio).

**3. Comando palette global do hub (`Ctrl+P`)** — overlay tipo cmd+k que permite saltar entre tabs, abrir entidade por ID, executar `/clear`, `/export`. Reusa `cmdk` já presente no projeto.

**4. Graph: legenda + tooltip de nós** — overlay no canto do `NetworkVisualization` explicando cores por tipo + contagem de cada categoria filtrada.

**5. Entity 360: cópia rápida + ações** — botão "copiar ID" (mono), "abrir no CRM" (link para `/contatos/:id` etc.) em cada metadata header.

**6. CrossRef: comparação lado-a-lado de metadata** — tabela com 1 coluna por entidade selecionada e linhas com campos comuns (criação, score, última interação) destacando diferenças.

**7. Ask: streaming visual + token count** — indicador de "digitando" caractere-a-caractere na resposta system (efeito typewriter com `requestAnimationFrame`) + contador de linhas/registros retornados em badge.

**8. Telemetria local + memória** — hook `useIntelTelemetry` que loga em `console.debug` + sessionStorage: tab views, queries executadas, exports, tempo médio de resposta. Painel oculto via `?debug=1`. Atualizar `mem://features/intelligence-hub.md`.

## Restrições mantidas
- Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem mexer em CRM/Pipeline/ABM.

## Critério 10/10
Cada etapa fecha com: (a) compila, (b) console limpo, (c) feature funcional verificável, (d) constraints respeitadas. Memória atualizada ao fim.

Aprove e executo as 8 em sequência sem pausas.
