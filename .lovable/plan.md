
Rodadas 1, 2 e 3 entregues (24 melhorias acumuladas). Para fechar o Intelligence Hub além do 10/10, proponho **Rodada 4** — 8 novas melhorias atômicas focadas em colaboração, exploração visual e integração cruzada com o resto do CRM.

# Rodada 4 — Intelligence Hub

**1. Snapshots de sessão compartilháveis** — botão "💾 SNAPSHOT" no header do hub captura estado completo (tab + filtros + entidade aberta + bookmarks visíveis) em URL compactada (base64 JSON). Painel "RECENT_SNAPSHOTS" lista os 5 últimos snapshots locais com timestamp.

**2. Diff entre 2 entidades no Entity 360** — quando há ≥2 itens no histórico, botão "DIFF" compara metadata da entidade atual com a anterior, destacando campos adicionados/removidos/alterados (estilo git diff em mono).

**3. Graph: foco em entidade pinned** — clicar em um bookmark do PinnedEntitiesPanel com modificador (Shift+click) abre o Graph filtrado naquela entidade (passa `?focusId=...&focusType=...`). NetworkVisualization respeita o focusId destacando o nó.

**4. CrossRef: exportar comparison + timeline juntos** — botão "EXPORT_BUNDLE" gera ZIP virtual com 2 CSVs (comparison.csv + common-events.csv) usando JSZip se disponível, fallback para download sequencial. Inclui metadata header com entidades selecionadas.

**5. Ask: sugestões contextuais inteligentes** — substituir SUGGESTIONS estático por hook `useContextualSuggestions` que lê última entidade aberta no Entity 360 e gera 4 perguntas relacionadas (ex: "Últimas 10 interações com [nome]?", "Deals abertos da [empresa]?"). Fallback para genéricas quando não há contexto.

**6. Status bar: indicador de fonte de dados** — badge "DB:LIVE" / "DB:CACHE" / "DB:STALE" baseado em `dataUpdatedAt` da query principal vs idade. Tooltip explica significado. Cor segue paleta de severidade (verde/amarelo/vermelho).

**7. Keyboard map overlay (`?`)** — pressionar `?` (fora de inputs) abre overlay modal listando TODOS os atalhos do hub: G/E/C/A, ⌘K, ⌘P, Alt+←/→, ?. Estilo terminal mono.

**8. Modo "presentation" + memória** — toggle no header "PRES" que oculta status bar, telemetria e debug; aumenta tipografia em 15%; força tabs em `?tab=` na URL para reabertura rápida. Persistido em `localStorage` (intel-pres-v1). Atualizar `mem://features/intelligence-hub.md`.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem mexer em CRM/Pipeline/ABM, sem `useEffect` para fetch.

## Critério 10/10 por etapa
(a) compila sem erro, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória atualizada ao fim.

Aprove e executo as 8 em sequência sem pausas.
