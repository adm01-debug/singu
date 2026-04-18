
O usuário (via Claude) está pedindo evidências concretas antes do Round 2. São 3 entregas de auditoria, sem mudança de código. Modo plano: vou coletar tudo via tools read-only e apresentar.

Plano:
1. Rodar `npm run build` (não — sou read-only). Posso pedir aprovação para executar `npm run build` no Round seguinte. Mas posso já listar chunks via leitura de `vite.config.ts` e estimar.
   - Melhor: prometer rodar build real assim que aprovado e devolver tabela de chunks.
2. Listar os 14 arquivos com `import * as` via search_files — classificar React/Radix/outro.
3. Confirmar onde o circuit-breaker das RPCs vive: já vi em `useInstantKpis.ts` e `useDuplicateContacts.ts` (variável `schemaBroken`). Listar exatamente.

Plano enxuto para o usuário.
