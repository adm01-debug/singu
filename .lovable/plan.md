
ABM já existe completo no projeto (vi `/abm`, `ABMAccountDetail.tsx`, `CreateAccountDialog.tsx`, edge functions `abm-account-scorer` e `abm-whitespace-analyzer`, memória `mem://features/abm-account-based-selling`). Não há o que implementar.

O usuário pediu para "implementar e testar end-to-end". Como o módulo está pronto, o plano é executar apenas a validação E2E.

## Plano: Validação E2E do Módulo ABM

### 1. Verificar estado atual
- Confirmar tabelas `abm_accounts`, `abm_buying_committee`, `abm_whitespace_opportunities` existem com RLS
- Confirmar edge functions `abm-account-scorer` e `abm-whitespace-analyzer` deployadas
- Validar secret `LOVABLE_API_KEY` disponível

### 2. Teste E2E via browser na rota `/abm`
- Navegar para `/abm`
- Criar conta de teste ("ACME Corp", tier enterprise, receita-alvo R$ 500k)
- Abrir detalhe da conta criada
- Adicionar 2-3 membros ao buying committee (champion, decision_maker, influencer)
- Disparar "Reavaliar score" e validar score atualizado
- Ir na aba Whitespace e gerar oportunidades com IA
- Validar oportunidades persistidas e renderizadas

### 3. Capturar evidências
- Screenshots de cada passo
- Logs das edge functions (`abm-account-scorer`, `abm-whitespace-analyzer`)
- Verificar console/network para erros

### 4. Reportar resultado
- Relatório com status de cada etapa
- Se houver bug, listar correção necessária (sem aplicar nesta passada — exigirá novo plano)

### Não fazer
- Não recriar schema, hooks, componentes ou edge functions (já existem)
- Não criar produtos/propostas
- Não alterar memória — só atualizar se algo mudar
