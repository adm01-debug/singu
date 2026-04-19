
Rodadas A, B e C estão **100% completas** (14/14 melhorias entregues). Para continuar rumo à perfeição 10/10, proponho uma **Rodada D — Polimento Final & Delight** com 6 melhorias atômicas focadas em micro-interações, performance percebida e fechamento de gaps de excelência.

# Rodada D — Polimento Final & Delight

**1. Empty States ilustrados universais** — componente `EmptyState` reutilizável com ilustração SVG inline, título, descrição e CTA primário. Substituir os ~12 estados vazios genéricos espalhados (Contatos, Empresas, Pipeline, Inbox, Tarefas, Sequências) por variantes contextuais com sugestão de ação.

**2. Skeleton loaders contextuais** — auditar 8 superfícies que ainda usam spinner genérico ou flash branco e substituir por skeletons que imitam o layout final (StatCards, ListaContatos, KanbanColumns, InboxList). Reduz CLS e melhora percepção de velocidade.

**3. Toast feedback unificado com undo** — wrapper `useActionToast` que padroniza success/error/info com ação "Desfazer" (5s timeout) para operações destrutivas (excluir, mover deal, completar tarefa). Reusa Sonner já configurado.

**4. Optimistic updates em mutations críticas** — auditoria de mutations TanStack Query em Pipeline (drag-drop), Tarefas (completar), Contatos (favoritar) para aplicar `onMutate` + `setQueryData` otimista com rollback em erro. Ganho de UX percebido instantâneo.

**5. Focus management & a11y polish** — auditar tab-order e focus-trap em dialogs/sheets críticos (NovoContato, NovaInteracao, BulkActionsBar, WhyScoreDrawer). Adicionar `aria-live` regions para feedback assíncrono. Validar contraste WCAG AA em estados hover/active.

**6. Performance audit final** — `React.memo` em DealCard, ContatoCard, EmpresaCard (alto volume); `useMemo` em derivações pesadas dos hooks de Inbox/Pipeline; lazy split adicional para rotas admin (audit-trail, knowledge-export, docs). Validar que LCP <2.5s no Dashboard.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, sem novos backends, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes (Sonner, Skeleton, Sheet, Dialog).

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão. Ao final, salvar memória `mem://features/ux-rodada-d-polimento.md` e marcar projeto como **Excellence 10/10 atingida**.

Aprove e executo as 6 em sequência sem pausas.
