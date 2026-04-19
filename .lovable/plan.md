
# Plano: Sequência de melhorias até 10/10 no Intelligence Hub

Vou executar uma trilha de **8 melhorias atômicas** sobre o módulo `/intelligence` recém-criado, sem pausas nem perguntas, no estilo "uma melhoria por vez com excelência" (preferência registrada do usuário).

## Sequência de execução

**1. Fix crítico — Build/Type safety**
- `useAskCrm` real não tem campos `data`/`sql`/`timestamp` no shape usado em `AskTab.tsx`. Validar interface real e ajustar (ou estender) sem quebrar o hook existente.
- Verificar prop `height` em `NetworkVisualization` e `search` em `queryExternalData` (provável incompatibilidade silenciosa).

**2. Loading & Error states robustos**
- Skeleton intel-themed em todos os 4 tabs (sem usar `<Skeleton>` shadcn padrão — criar `IntelSkeleton` mono).
- Toasts em falhas via `sonner` já presente.
- Retry button em erros de query.

**3. Filtros operacionais no GraphTab**
- Filtros: tipo de entidade (contact/company/deal), score mínimo (slider), período (7d/30d/90d).
- URL state via `useSearchParams` (padrão SINGU já adotado).

**4. Entity360 — densidade real**
- Adicionar workspace_accounts, contact_relatives e people_intelligence_events na timeline.
- Tornar `related` clicável (navega entre entidades sem sair da view).
- Histórico de navegação (breadcrumb intel-mono).

**5. CrossRef — heatmap temporal**
- Mini-heatmap visual dos `temporalOverlap` (grid 7×N).
- Insight textual ("Maior sobreposição em DD/MM com X interações").
- Export CSV dos resultados.

**6. AskTab — comandos rápidos + atalhos**
- Atalho `⌘K` para focar input.
- Histórico persistente em localStorage (10 últimas).
- Comando `/clear`, `/export`, `/help`.

**7. Performance & a11y**
- `React.memo` em DataGrid e EntityCard.
- `aria-label` em botões icon-only.
- Foco visível com ring `--intel-accent`.
- Skip-to-content em Intelligence.tsx.

**8. Polimento visual final + memória**
- Animação de entrada nas tabs (framer-motion stagger).
- Sound design opcional (toggle): "click" sutil em interações via Web Audio API (off por padrão).
- Status bar fixa no rodapé do hub: latência, último refresh, contagem de erros.
- Atualizar `mem://features/intelligence-hub.md` com tudo que foi adicionado.

## Restrições respeitadas
- Português em toda UI nova
- Max 400 linhas/arquivo (vou splittar componentes grandes)
- Sem novos backends — só reuso de RPCs/edge functions
- Sem mexer em CRM/Pipeline/ABM
- Sem `any`, sem `dangerouslySetInnerHTML`
- TanStack Query exclusivo (zero `useEffect` para fetch)

## Critério de "10/10"
Cada uma das 8 etapas só fecha quando: (a) compila, (b) sem warning de console relacionado, (c) cumpre a feature descrita, (d) respeita constraints core. Ao fim, atualizo a memória e entrego resumo executivo.

Aprove e eu executo as 8 em sequência sem pausas.
