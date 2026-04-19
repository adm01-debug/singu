
Status: 35/35 melhorias entregues (Rodadas A-G). Para sustentar a excelência e cobrir camadas ainda intocadas, proponho **Rodada H — Acessibilidade, i18n-readiness & DX Final**, com 5 melhorias atômicas finais.

# Rodada H — Acessibilidade WCAG AA, Resiliência DX & Polimento Profundo

**1. Auditoria WCAG 2.1 AA em superfícies críticas** — varrer Pipeline, Contatos, Empresas, Inbox, Tarefas e Dashboard adicionando: `aria-label` em IconButtons sem texto, `role="status"` em loaders, `aria-live="polite"` em toasts, foco visível (`focus-visible:ring-2`) em todos interativos, `aria-current="page"` em nav ativo, skip-link `<a href="#main">`. Documentar checklist em `mem://standards/accessibility-wcag-aa`.

**2. Storybook-lite local — `/admin/component-gallery`** — página admin que renderiza variantes de primitivas críticas (Button, Card, EmptyState, ActionToast, SearchableSelect, BulkActionsBar, WhyScoreDrawer) com props controláveis. Substitui necessidade de Storybook completo. Acelera QA visual e onboarding de novos devs.

**3. Hook `useKeyboardShortcuts` global + cheat-sheet** — centralizar atalhos hoje espalhados (⌘K busca, ⌘⇧E email, G+P pipeline, G+C contatos, ?+? help). Modal `KeyboardCheatsheet` aberto com `?` exibindo todos. Garante consistência e descoberta.

**4. Edge function `health-aggregate`** — endpoint único que agrega saúde de: external-data (latência), ask-crm (rate limit usage), meeting-summary (last error), database linter status, web-vitals p75. Retorna JSON `{status: "healthy"|"degraded"|"down", checks: [...]}`. Painel `/admin/system-health` consome e mostra semáforo.

**5. ADR-011 + CHANGELOG.md sintético** — formalizar `docs/adr/011-rodada-h-accessibility-dx.md` e criar `CHANGELOG.md` na raiz consolidando todas as 40 melhorias por rodada (A-H), com data, escopo e arquivos-chave. Vira referência única para auditoria executiva.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão. Memória final em `mem://features/ux-rodada-h-accessibility.md` consolidando **40/40 melhorias**.

Aprove e executo as 5 em sequência sem pausas.
