
Rodada 6 já entregou 6/8. Faltam 2 itens da Rodada 6 + posso adicionar mais 6 atômicas para Rodada 7 (total 8 nesta execução), mantendo o ritmo 10/10.

# Rodada 6.5 + Rodada 7 — Intelligence Hub (8 melhorias)

**Pendentes da Rodada 6:**

**1. Graph: botão PATH (BFS entre 2 bookmarks)** — botão "🔗 PATH" no header do `GraphTab` ativo apenas com ≥2 bookmarks. Usa `lib/graphPath.ts` (já criado) sobre as edges do grafo, destaca caminho mais curto e atenua nós irrelevantes via prop nova `highlightPath` no `NetworkVisualization`. Estado em URL `?path=id1,id2`.

**2. Ask: histórico exportável + replay individual** — no `AskHistoryPanel`: botão "⤓ EXPORT" usa `intelExportUniversal` (json/md) sobre as últimas 50 queries; cada item ganha botão "▶️ REPLAY" que reexecuta a query daquele item.

**Novas — Rodada 7:**

**3. CrossRef: aceitar `?pivot=type:id` na URL** — quando o `Entity360Tab` envia pivot via Shift+click (já implementado), o `CrossRefTab` lê o param, adiciona automaticamente a entidade ao seletor e limpa o param. Fecha o ciclo do quick-pivot.

**4. Painel "TOUR" reabrível via `?` overlay** — adicionar botão "▶ REPLAY TOUR" no `KeyboardMapOverlay` que aciona `useIntelTour().reopen()`. Usuário pode revisitar onboarding a qualquer momento.

**5. Tema: aplicar paleta amber também na status bar e badges** — auditoria fina dos tokens `--sev-info` e `--intel-accent-soft` em `IntelStatusBar`, `IntelBadge`, `IntelLatencyBadge`, `IntelDataSourceBadge` para garantir contraste WCAG AA no tema amber. Sem hard-coded colors.

**6. Bookmarks badge: navegação com click** — clicar no "★N" do `IntelBookmarksNotesBadge` abre `IntelCommandPalette` filtrado em "Bookmarks". Clicar em "NOTE:N" foca o aside `PinnedEntitiesPanel` (scroll suave).

**7. Timeline mensal: filtro por kind** — no `EntityMonthlyTimeline` adicionar chips "ALL / INTERACTION / DEAL / EVENT" para filtrar tipos de evento. Estado local + persistência em `localStorage` (`intel-timeline-filter-v1`).

**8. Atualizar memória `mem://features/intelligence-hub.md`** — documentar Rodada 6 + 7 completas: timeline mensal, pivot, path, theme, tour, exports, badges. Versão final 10/10 sustentado.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem mexer em CRM/Pipeline/ABM, sem `useEffect` para fetch.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória atualizada ao fim.

Aprove e executo as 8 em sequência sem pausas.
