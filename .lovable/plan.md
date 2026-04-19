
Status atual: 25/25 melhorias entregues (Rodadas A+B+C+D+E). Para continuar rumo à perfeição absoluta, proponho **Rodada F — Hardening de Segurança & Qualidade Profunda**, com 5 melhorias atômicas focadas em camadas que ainda não foram cobertas pelas rodadas anteriores: segurança DB, testes, telemetria e DX.

# Rodada F — Hardening de Segurança & Qualidade Profunda

**1. Auditoria de segurança DB com supabase linter** — rodar `supabase--linter`, classificar findings (CRITICAL/HIGH/MED), corrigir 100% dos CRITICAL/HIGH (RLS faltante, policies permissivas, search_path mutable em functions). Documentar exceções justificadas em `mem://architecture/security/linter-baseline`.

**2. Testes unitários para hooks críticos** — criar suíte Vitest cobrindo: `useCompleteTask` (optimistic + rollback), `useReopenTask`, `useMoveDeal` (snapshot/restore), `useActionToast.destructive` (Undo callback). Meta: ≥80% coverage nesses 4 hooks. Setup `vitest.config.ts` + `@testing-library/react` se ainda não existir.

**3. Smoke tests E2E para fluxos críticos** — script Playwright headless cobrindo 3 jornadas: (a) login → dashboard → criar contato, (b) abrir Pipeline → mover deal entre estágios, (c) Inbox → completar tarefa → desfazer. Roda em CI como gate de regressão.

**4. Wire-up `useActionToast.destructive` em deletes reais** — completar a Etapa 1 da Rodada E que ficou parcial: aplicar destructive+Undo em **exclusão de Contato, Empresa e Tarefa** (não só "completar"). Implementar `useRestoreContact/Company/Task` que re-insere via RPC ou cache snapshot.

**5. Telemetria de erros front-end com Sentry-like local** — wrapper `errorReporting.ts` (já existe parcial) recebe upgrade: captura `window.onerror`, `unhandledrejection`, erros TanStack Query (via `QueryCache onError`), persiste em `error_logs` (Supabase) com `requestId`, `route`, `userAgent`. Painel admin `/admin/error-logs` lista últimos 100 com filtros.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature/teste verificável, (d) sem regressão. Memória final em `mem://features/ux-rodada-f-hardening.md` consolidando **30/30 melhorias**.

Aprove e executo as 5 em sequência sem pausas.
