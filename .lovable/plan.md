
Rodadas 1 e 2 entregues. Proponho **Rodada 3** — 8 melhorias atômicas finais para fechar o Intelligence Hub em 10/10, sem pausas.

# Rodada 3 — Intelligence Hub

**1. Atalhos globais G/E/C/A** — pressionar uma letra (fora de inputs) salta direto para a aba correspondente. Tooltip nas tabs mostrando o atalho.

**2. Bookmarks de entidades** — botão "★" no Entity 360 salva entidade no `localStorage` (máx 10). Painel lateral "PINNED" lista bookmarks e permite reabertura com 1 clique.

**3. Histórico de navegação Entity 360** — pilha real de navegação (não só breadcrumb único): voltar/avançar entre entidades visitadas na sessão, atalho `Alt+←` / `Alt+→`.

**4. Graph: snapshot PNG + share link** — botão "Exportar PNG" usa `html-to-image` (já presente?) ou `canvas.toDataURL` do SVG para baixar snapshot do grafo. Botão "Copiar link" gera URL com filtros atuais.

**5. CrossRef: timeline de eventos comuns** — abaixo do heatmap, lista cronológica das interações que envolvem TODAS as entidades selecionadas (interseção real, não apenas mesmo dia).

**6. Ask: salvar query como "view"** — botão "Salvar" em respostas com dados → entrada nomeada em `localStorage`. Painel "SAVED_VIEWS" no rodapé do AskTab para reexecutar.

**7. Status bar: latência média + p95** — calcular tempo médio das últimas 20 queries (via `useIntelTelemetry` events com `durationMs`) e p95. Exibir na status bar com cor por severidade (verde <500ms, amarelo <2s, vermelho ≥2s).

**8. Densidade configurável + memória** — toggle "COMPACT/COMFORTABLE" no header do hub, persistido em `localStorage`. Ajusta padding de `intel-card` e tamanhos via classe modificadora `.intel-density-compact`. Atualizar `mem://features/intelligence-hub.md`.

## Restrições mantidas
- Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem mexer em CRM/Pipeline/ABM, sem `useEffect` para fetch.

## Critério 10/10 por etapa
(a) compila sem erro, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória atualizada ao fim.

Aprove e executo as 8 em sequência sem pausas.
