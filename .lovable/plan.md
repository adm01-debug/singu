
# Plano: Teste E2E manual — Fluxo de Edição Concorrente

## Contexto

O optimistic locking foi implementado em todas as camadas (Edge Function `version-guard`, lib `concurrentEditToast`, hooks `useContacts`/`useCompanies`, UI `Contatos.tsx`/`Empresas.tsx`) e validado por testes automatizados (5/5 cenários do `version-guard_test.ts` passaram).

Falta o **teste E2E manual no preview ao vivo** com duas abas reais.

## Limitação técnica

A automação de browser disponível (`browser--*`) opera em **uma única sessão/aba** por vez. Não é possível abrir duas abas simultâneas e manter ambas autenticadas para reproduzir o conflito real entre usuários concorrentes.

## Abordagem proposta

### Opção A — Simulação E2E via duas requisições HTTP (recomendada)

Reproduzir o cenário diretamente contra a Edge Function `external-data` usando `supabase--curl_edge_functions`:

1. **GET inicial** — buscar um contato real (capturar `id` e `version` atual).
2. **UPDATE #1** — `update_with_version` com versão correta → esperado **HTTP 200**, `version` incrementada para N+1.
3. **UPDATE #2** — `update_with_version` reusando a versão antiga N → esperado **HTTP 409** com payload JSON `{ error: "CONCURRENT_EDIT", entity: "contacts", id, currentVersion, attemptedVersion }`.
4. **Restaurar** — reverter o campo de teste (`notes`) ao valor original via update válido.

Critério de sucesso:
- (a) HTTP 200 no primeiro update + version+1
- (b) HTTP 409 + JSON estruturado no segundo
- (c) header `x-trace-id` presente em ambas as respostas

### Opção B — Teste manual pelo usuário no preview

Roteiro a executar manualmente:
1. Abrir `/contatos` em **Aba 1** e **Aba 2** (mesma sessão, navegador suporta).
2. Em ambas, clicar **Editar** no mesmo contato.
3. Aba 1: alterar campo "Notas" → **Salvar** (sucesso, toast verde).
4. Aba 2: alterar campo "Notas" → **Salvar**.
5. Verificar que aparece o toast destrutivo **"Edição concorrente detectada"** com botão **"Recarregar"**.
6. Clicar em **Recarregar** e confirmar que a query é invalidada e o formulário recebe a versão atualizada.

## Plano de execução

Executar **Opção A** (automatizável e determinística) e entregar relatório com os 3 status HTTP, payloads e trace IDs. Em paralelo, fornecer roteiro escrito da **Opção B** para o usuário validar a parte visual (toast + ação Recarregar) que apenas o navegador real expõe.

## Arquivos tocados

Nenhum. Apenas execução de testes contra ambiente live.

## Critério de fechamento

(a) Relatório mostrando HTTP 200 → 409 → 200, (b) confirmação de payload JSON estruturado no 409, (c) trace IDs capturados, (d) roteiro entregue ao usuário para validação visual do toast no preview.
