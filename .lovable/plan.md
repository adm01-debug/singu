
Status atual: 30/30 melhorias entregues (Rodadas A+B+C+D+E+F). Para continuar rumo à perfeição absoluta, proponho **Rodada G — Observabilidade Profunda & Hardening Final**, com 5 melhorias atômicas focadas em camadas ainda não cobertas: documentação viva, instrumentação real-user, hardening de edge functions, automação CI e DX de testes.

# Rodada G — Observabilidade Profunda & Hardening Final

**1. Adoção real do `useActionToast.destructive` em deletes de UI** — fechar pendência da Rodada F item 4: wire-up nos handlers `handleDelete` de Contatos, Empresas e Tarefas (UI), passando `onUndo` que dispara `useRestoreContact/Company/Task` (snapshot já existe nos hooks `deleteContact`/`deleteCompany`). Implementar `useRestoreTask` reaproveitando `insertExternalData('tasks', snapshot)`.

**2. Rate limit + structured logs em 3 edge functions críticas** — auditar `external-data`, `ask-crm` e `meeting-summary`: garantir uso do `rateLimiter.ts` compartilhado (limites por função), `requestId` em todos os logs e CORS padrão `@supabase/supabase-js/cors`. Documentar inventário em `mem://architecture/edge-functions/security`.

**3. Real User Monitoring (RUM) — Web Vitals → error_logs** — instrumentar `web-vitals` (LCP/CLS/INP/FCP/TTFB) capturando samples e enviando ao mesmo pipeline de `errorReporting` quando exceder thresholds (LCP>2.5s, CLS>0.1, INP>200ms). Painel `/admin/error-logs` ganha aba "Performance" filtrando por `source=web-vitals`.

**4. CI workflow para Vitest + bundle size** — `.github/workflows/ci.yml` rodando: `npm ci`, `npm run build`, `node scripts/check-bundle-size.mjs`, `npx vitest run`. Falha gate impede merge com testes vermelhos ou bundle acima do orçamento. README ganha badges de status.

**5. Documentação viva: ARCHITECTURE.md + ADR sintético** — gerar `docs/ARCHITECTURE.md` consolidando: stack, fluxo de dados (external-data proxy), camadas de resiliência (circuit breaker + retry + fallback), rotas críticas, módulos por área. Adicionar ADR-009 em `docs/adr/` registrando decisão de "30/30 + Rodada G — Excellence sustentada".

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature/teste verificável, (d) sem regressão. Memória final em `mem://features/ux-rodada-g-observabilidade.md` consolidando **35/35 melhorias**.

Aprove e executo as 5 em sequência sem pausas.
