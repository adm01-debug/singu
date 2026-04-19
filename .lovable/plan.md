
Rodadas 1-4 entregues (32 melhorias acumuladas). Para continuar rumo ao 10/10 sustentado, proponho **Rodada 5** — 8 novas melhorias atômicas focadas em workflows avançados, integração e qualidade enterprise.

# Rodada 5 — Intelligence Hub

**1. Anotações por entidade** — campo de texto livre persistido em `localStorage` (chave `intel-notes-v1` + entityKey) no Entity 360. Botão "📝 NOTE" abre painel inline com textarea + autosave (debounce 500ms) + timestamp da última edição. Útil para hipóteses de investigação.

**2. Comparação de até 3 entidades em DIFF** — estender `MetadataDiffPanel` para aceitar N entidades (até 3) renderizadas em colunas lado-a-lado. Seletor no header do painel permite escolher quais 2-3 do histórico comparar.

**3. Graph: salvar layout/zoom** — botão "💾 LAYOUT" persiste em `localStorage` (chave `intel-graph-layout-v1`) o zoom + pan + filtros atuais. Botão "🔄 RESTORE" reaplica. Útil para retomar exploração visual exata.

**4. CrossRef: índice de sobreposição** — métrica calculada (Jaccard similarity) entre as entidades selecionadas usando interações compartilhadas. Exibido como `MetricMono` no topo do CrossRef ("OVERLAP_INDEX: 42%") com tooltip explicando fórmula `|A∩B| / |A∪B|`.

**5. Ask: re-executar última query (`R`)** — atalho global `R` (fora de inputs) reexecuta automaticamente a última query do AskTab e foca a tab. Indicador visual no histórico mostra "● LIVE" no item recém-reexecutado.

**6. Status bar: contador de queries em voo** — badge "⟳ N" mostrando `useIsFetching()` em tempo real, com pulso animado quando >0. Substitui implicitamente o estado idle do data source. Tooltip lista os queryKeys ativos (top 3).

**7. Export universal multi-formato** — utility `intelExportUniversal(data, name, format)` suportando `csv` | `json` | `tsv` | `markdown-table`. Adicionar dropdown ao lado dos botões EXPORT existentes (Ask, CrossRef) para escolher formato. Default permanece CSV.

**8. Health check do hub + memória** — painel acessível via `?diag=1` mostra: status de cada hook crítico (`useCrossReference`, `useEntity360`, `useAskCrm`), última latência, contagem de itens em cada `localStorage` do intel, versão do schema. Botão "RESET_INTEL_STATE" limpa todos os `intel-*` keys com confirmação. Atualizar `mem://features/intelligence-hub.md`.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem mexer em CRM/Pipeline/ABM, sem `useEffect` para fetch.

## Critério 10/10 por etapa
(a) compila sem erro, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória atualizada ao fim.

Aprove e executo as 8 em sequência sem pausas.
