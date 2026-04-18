
## Diagnóstico: Preview em branco

A imagem mostra tela cinza com ícone de arquivo quebrado — o app React não está montando. Causas prováveis após a sessão recente:

1. **Edição em `bun.lock`** (registrada nas últimas mensagens) pode ter quebrado resolução de dependências
2. Erro de import em arquivos criados nas melhorias #17/#18/#19 (`TouchpointSequenceCard`, `IntelligenceTab`)
3. Erro de runtime no boot (`App.tsx`, providers)

## Plano de investigação (read-only)

1. Ler logs do console e erros de runtime via `code--read_console_logs` e `code--read_runtime_errors`
2. Ler `code--read_network_requests` para ver se o bundle JS está 200 ou falhando
3. Inspecionar `bun.lock` (status), `package.json`, e os 3 arquivos criados recentemente:
   - `src/hooks/useTouchpointSequences.ts`
   - `src/components/dashboard/TouchpointSequenceCard.tsx`
   - `src/components/dashboard/tabs/IntelligenceTab.tsx`
4. Verificar `src/App.tsx` para regressão de providers

## Plano de correção (após diagnóstico)

Dependendo do achado:
- **Se `bun.lock` corrompido** → restaurar via `bun install` (sandbox executa automaticamente ao detectar mudança em package.json)
- **Se erro de import nos arquivos novos** → corrigir paths/exports
- **Se erro de runtime** → patch cirúrgico no componente ofensor

Aprovar para eu executar a investigação e aplicar a correção.
