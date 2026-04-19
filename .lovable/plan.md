
Faltam 1 item da Rodada B + Rodada C inteira (5 itens). Vou executar 6 melhorias atômicas em sequência.

# Rodada B (final) + Rodada C — Transformação

**1. WhyScoreDrawer wire-up universal** (fechar Rodada B) — integrar `WhyScoreDrawer` em `LeadScoreBadge`, `DealConfidenceBadge` (Pipeline), `ChurnRiskWidget` e `DealRiskBadge`. Padronizar `scoreKey` como `<modulo>:<entidade>:<id>`. Cada badge recebe prop `factors` calculada localmente a partir dos dados já existentes.

**2. SavedViewsBar em Empresas e Pipeline** — replicar integração já feita em Contatos para `Empresas.tsx` e `Pipeline.tsx`. Cada um define seu schema de state (filtros + view mode + ordenação). Reusa hook `useSavedViews` e componente `SavedViewsBar`.

**3. Bulk Actions universais** — novo hook `useBulkSelection<T>` + componente `BulkActionsBar` (flutuante no rodapé) com ações: Atribuir, Adicionar tag, Exportar CSV, Excluir. Wire-up em Contatos e Empresas (modo lista/tabela). Checkbox por linha + "selecionar tudo" + contador.

**4. Keyboard-first navigation** — hook `useListKeyboardNav` (j/k navegação, enter abre, x seleciona, ? mostra atalhos). Hint visual discreto no rodapé das listas. Aplicar em Contatos e Empresas. Reusa primitiva de KeyboardMapOverlay do Intelligence.

**5. Inbox unificada `/inbox`** — nova rota com 3 colunas: lista priorizada (interações pendentes + tarefas vencidas + notificações), preview central, ações laterais. Filtros por canal (Email/WhatsApp/Voice/Tarefa). Modo "Zero Inbox" com celebração ao zerar. Reusa dados existentes via TanStack Query.

**6. Mobile responsiveness audit** — auditoria fina de Pipeline (kanban com swipe horizontal mobile), Inbox (stack vertical em mobile), Header (command bar trigger visível em mobile), Sidebar (drawer overlay). Adicionar breakpoints `sm:` faltantes e testar em 375px/768px.

## Restrições
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória final em `mem://features/ux-rodada-c-transformacao.md`.

Aprove e executo as 6 em sequência sem pausas.
