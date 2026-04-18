
O usuário solicitou auditoria técnica exaustiva 22 dimensões. Vou fazer leitura profunda do codebase antes de apresentar o relatório (não é implementação — é diagnóstico).

Plano: explorar README, estrutura, configs críticas (vite, tsconfig, package.json), security headers, edge functions shared, RLS policies via supabase linter, scan de segurança, e amostra de hooks/components. Depois entregar o relatório completo com scorecard, top 10 ações e roadmap em 3 ondas.

## Plano de Execução

### Fase 1 — Coleta exaustiva (read-only)
1. **Inventário**: `package.json`, `vite.config.ts`, `tsconfig.app.json`, `index.html`, `README.md`, `ARCHITECTURE.md`, listagem `src/`, `supabase/functions/`, `supabase/migrations/`, `docs/adr/`
2. **Segurança backend**: rodar `security--run_security_scan` + `supabase--linter` + amostra de RLS via `supabase--read_query` em `pg_policies`
3. **Edge functions**: amostrar 5 funções críticas (`external-data`, `health`, `ai-*`, `lux-trigger`) para padrão Deno.serve, validação Zod, rate limit
4. **Frontend**: amostrar `App.tsx`, `useAuth.tsx`, `externalData.ts`, `circuitBreaker.ts`, `resilientFetch.ts`, `validationSchemas.ts`, `logger.ts`
5. **Testes**: listar `src/**/__tests__/` e `vitest.config.ts` (se existir) para cobertura
6. **CI/CD**: `.github/workflows/` se existir
7. **Tipagem**: confirmar strict mode, contar `any` em src/
8. **Performance**: chunks no vite, PWA config, bundle strategy

### Fase 2 — Análise das 22 dimensões
Para cada dimensão: **Nota (0-10)** + **Evidências concretas (arquivo:linha)** + **Gaps para 10/10** + **Ações corretivas**.

### Fase 3 — Entrega
1. **Scorecard ASCII** completo (tabela 22 linhas + nota geral ponderada)
2. **Top 10 ações** ordenadas por ROI (impacto÷esforço)
3. **Roadmap 3 ondas**: 🔴 Quick Wins (1-3d) / 🟠 Sprint 1 (1-2sem) / 🟡 Sprint 2 (2-4sem)
4. **Parágrafo final** sobre maturidade

### Pesos para média ponderada
- ×3 Crítico: Segurança, Autenticação, Autorização, Data Integrity
- ×2 Alto: Banco, Tipagem, Validação, Testes, Arquitetura
- ×1 Padrão: demais 11 dimensões

### Restrições
- Sem inventar evidências — só citar o que ler
- Marcar "NÃO AUDITÁVEL" em infra/processos sem acesso (CI/CD se inexistente, on-call, pen-test)
- PT-BR
- Pausa em #20 da fila de melhorias enquanto auditoria roda — retomar #20 (Deal Velocity Benchmark) após aprovação do relatório

### Output ao final
Relatório completo em chat (sem alterações de código) — usuário decide depois quais ações virar PRs.

Aprovar para iniciar a varredura.
