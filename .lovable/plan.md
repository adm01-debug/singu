
Rodadas 1-5 entregues (40 melhorias acumuladas). Para a **Rodada 6** — 8 novas melhorias atômicas focadas em workflows colaborativos, exploração temporal e qualidade de dados.

# Rodada 6 — Intelligence Hub

**1. Timeline temporal global** — nova visualização "TIMELINE" no Entity 360 que renderiza interações + deals + eventos de people-intelligence em uma única faixa cronológica vertical com agrupamento por mês. Botão "📅 TIMELINE" toggle no header.

**2. Quick-pivot entre tabs** — selecionar um item (interação no Entity 360, célula do heatmap no CrossRef, linha no Ask) com `Shift+click` abre `IntelCommandPalette` com ações sugeridas: "Abrir no Graph", "Comparar no CrossRef", "Investigar no Entity 360".

**3. Graph: highlight de path entre 2 entidades** — quando há 2 bookmarks ativos, botão "🔗 PATH" no Graph destaca o caminho mais curto entre eles (BFS) e oculta nós irrelevantes. Estado persistido em URL (`?path=id1,id2`).

**4. CrossRef: insights gerados** — painel "INSIGHTS" abaixo das métricas usa heurísticas locais (sem LLM) para gerar 3-5 observações sobre as entidades selecionadas (ex: "Atividade concentrada em segundas-feiras", "Pico de interações há 12 dias", "Sobreposição alta em deals fechados"). Sem novos backends.

**5. Ask: histórico exportável + replay** — botão no `AskHistoryPanel` para exportar últimas 50 queries em JSON/MD via `intelExportUniversal`. Cada item ganha botão ▶️ "REPLAY" individual.

**6. Status bar: indicador de bookmarks/notes** — badges "★N" e "📝N" na status bar mostrando contadores de bookmarks ativos e notas salvas. Click navega para painel correspondente.

**7. Tema "obsidian" alternativo** — toggle no header "THEME" alterna entre `intel-theme-cyan` (atual) e `intel-theme-amber` (acentos âmbar/dourado). Persistido em `localStorage` (`intel-theme-v1`). Implementado via classe no `<html>`.

**8. Onboarding tour + memória** — primeiro acesso ao `/intelligence` mostra overlay tour de 4 passos (header→tabs→aside→status bar) usando o componente nativo do projeto se existir, senão um overlay próprio. Persistido em `localStorage` (`intel-tour-v1`). Atualizar `mem://features/intelligence-hub.md`.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem mexer em CRM/Pipeline/ABM, sem `useEffect` para fetch.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória atualizada ao fim.

Aprove e executo as 8 em sequência sem pausas.
