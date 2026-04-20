
A Rodada H já foi entregue (40/40). Os 5 itens estão implementados:

1. **WCAG 2.1 AA** — `SkipNav`, `RouteAnnouncer`, `useAccessibleToast`, foco visível, `aria-current`. Documentado em `mem://standards/accessibility-wcag-aa`.
2. **Component Gallery** — `/admin/component-gallery` (`src/pages/admin/ComponentGallery.tsx`).
3. **Atalhos globais** — `useKeyboardShortcutsEnhanced` + `KeyboardShortcutsDialogEnhanced` (modal `?`).
4. **Health agregado** — edge function `system-health` agrega DB local/externo, WhatsApp, email, voice (consolida o `health-aggregate` proposto).
5. **ADR-011 + CHANGELOG** — `docs/adr/011-rodada-h-accessibility-dx.md` + `CHANGELOG.md`.

Memória final em `mem://features/ux-rodada-h-accessibility.md`.

# Rodada I — Polimento Final & Hardening Profundo (5 melhorias → 45/45)

Para continuar a evolução sem repetir trabalho, proponho cobrir camadas ainda intocadas:

**1. Auditoria a11y automatizada via `vitest-axe`** — adicionar `tests/a11y/critical-pages.test.tsx` rodando `axe-core` em Dashboard, Pipeline, Contatos, Empresas, Inbox. Gate no CI falha se houver violação `serious`/`critical`. Documenta cobertura real (não apenas checklist).

**2. `KeyboardCheatsheet` registry público + atalhos contextuais por rota** — expor `registerShortcut(scope, keys, handler, description)` permitindo que páginas adicionem atalhos locais (ex: Pipeline `J/K` navega cards, Inbox `R` responde). Cheatsheet filtra por escopo ativo.

**3. Component Gallery v2 — cobertura completa** — adicionar variantes faltantes: `SearchableSelect` (3 modos), `BulkActionsBar`, `WhyScoreDrawer`, `ExternalDataCard` (5 estados), `EmptyState` (com/sem ação). Hoje só cobre primitivas básicas.

**4. Edge function `health-aggregate` real** — consolidar `system-health` + `health` numa função única `health-aggregate` que adiciona checks faltantes: `ask-crm` rate limit usage, `external-data` p95 latency (últimas 100 chamadas), database linter status (cached). Página `/admin/system-health` consome endpoint único.

**5. CHANGELOG semantic-release + ADR-012** — converter `CHANGELOG.md` para formato Keep-a-Changelog estrito (Added/Changed/Fixed/Security por versão), adicionar tag `v2.1.0 — Rodada I`, ADR-012 registrando padrão de versionamento e gate a11y no CI.

## Restrições
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes. Critério 10/10 por etapa: (a) compila, (b) console limpo, (c) verificável, (d) sem regressão.

Memória final em `mem://features/ux-rodada-i-polimento-profundo.md` consolidando **45/45**.

Aprove e executo as 5 em sequência sem pausas.
