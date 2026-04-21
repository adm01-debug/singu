
# Plano: Persistência dos filtros da Ficha 360 já existe — adicionar UI consumidora

## Status atual (verificado)

O hook `useFicha360Filters` **já implementa toda a persistência na URL**:
- `?periodo=7|30|90|365` (omite quando é `90`, o default)
- `?canais=whatsapp,call,email,...` (CSV, omite quando vazio)
- Leitura via `useSearchParams` + restauração automática na montagem
- `setDays`, `setChannels`, `clear`, `activeCount` expostos

E o componente `FiltrosInteracoesBar` consome essas props corretamente.

**Lacuna real:** preciso confirmar se o hook está realmente plugado na seção "Últimas Interações" da Ficha 360 (página de detalhe de Contato/Empresa). Se já estiver, a feature está pronta e basta validar; se não, falta apenas conectar o hook ao componente que renderiza essa seção.

## Investigação necessária (antes de implementar)

1. Localizar onde "Últimas Interações" da Ficha 360 é renderizada (provavelmente em `ContatoDetalhe.tsx` ou `EmpresaDetalhe.tsx`, ou um subcomponente tipo `UltimasInteracoesSection`).
2. Verificar se ele já chama `useFicha360Filters()` e passa para `FiltrosInteracoesBar`.
3. Caso use `useState` local em vez do hook, fazer o swap.

## Implementação

### Caso A — já está plugado (mais provável)
Nenhuma mudança de código. Apenas validar:
- Abrir `/contato/<id>?periodo=7&canais=whatsapp,email`
- Confirmar que o seletor de 7d e os chips WhatsApp/Email aparecem ativos sem cliques
- Trocar período/canais e ver a URL mudar com `replace: true` (sem poluir histórico)

### Caso B — usa `useState` local
- Substituir `useState` por `useFicha360Filters()`
- Repassar `days`, `channels`, `setDays`, `setChannels`, `clear`, `activeCount` para `FiltrosInteracoesBar`
- Aplicar a filtragem usando `days` e `channels` exatamente como hoje
- Sem mudança de visual, sem nova query

### Padrões obrigatórios
- PT-BR
- `useSearchParams` com `{ replace: true }` (já no hook)
- Defaults omitidos da URL (período `90`, canais vazio)
- Zero novas queries
- Zero regressão em outras seções da Ficha 360

## Arquivos potencialmente tocados

**Editar (no máximo 1):**
- O componente que hoje renderiza "Últimas Interações" da Ficha 360, caso ainda use estado local

**Sem mudanças em:**
- `useFicha360Filters.ts` (já completo)
- `FiltrosInteracoesBar.tsx` (já completo)
- Qualquer hook de fetch (a filtragem é client-side sobre o array já carregado)

## Critério de fechamento

(a) Abrir um link com `?periodo=7&canais=whatsapp,email` na Ficha 360 restaura automaticamente o seletor de 7d e os chips WhatsApp/Email ativos, (b) trocar período ou canais atualiza a URL sem empilhar histórico (`replace: true`), (c) defaults (período 90d, canais vazio) ficam fora da URL para mantê-la limpa, (d) "Limpar" remove os params, (e) compartilhar o link reproduz exatamente o mesmo recorte para outro usuário, (f) zero novas queries de rede, (g) zero regressão em sentimento, KPIs, drawers ou outras abas.
