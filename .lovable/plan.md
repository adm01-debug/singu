
## Diagnóstico real encontrado
O problema não é só o sync `query ↔ URL`. Há um segundo gatilho mais crítico em `src/components/search/GlobalSearch.tsx`:

- `useSemanticSearch()` e `useConversationalSearch()` retornam **objetos novos a cada render**
- `GlobalSearch` usa esses objetos inteiros nas dependências:
  - `useEffect(..., [open, semantic, conv])`
  - `useCallback(..., [user, semanticMode, semantic])`
  - `useCallback(..., [conv])`
- Quando `open === false`, o efeito chama `semantic.reset()` e `conv.reset()`; como `semantic` e `conv` mudam de identidade a cada render, o efeito roda de novo e pode entrar em **loop de atualização**, travando a thread principal
- Isso bate com o console atual: o erro continua vindo de `GlobalSearch.tsx`, então a sidebar fica “clicável”, mas a navegação não avança

## O que vou corrigir
### 1) Tornar `GlobalSearch` estável
Em `src/components/search/GlobalSearch.tsx`:
- Desestruturar apenas membros estáveis dos hooks (`search`, `reset`, `loading`, `items`, etc.)
- Remover `semantic` e `conv` inteiros das dependências dos hooks
- Trocar dependências por callbacks/valores estáveis:
  - `performSearch` → depender de `semanticSearch`
  - efeito de fechamento → depender de `resetSemantic` e `resetConversational`
  - toggle conversacional → depender só de `resetConversational`

### 2) Blindar o reset ao fechar
Ainda em `GlobalSearch.tsx`:
- Manter reset apenas quando a busca fecha
- Evitar resets redundantes que disparam render sem necessidade

### 3) Revalidar a correção no front
Depois da correção, vou executar uma bateria forte de testes no preview:
- clicar repetidamente nos itens principais da sidebar
- testar seções recolhidas/expandidas
- testar navegação entre `/empresas`, `/contatos`, `/interacoes`, `/pipeline`, `/configuracoes`, `/revops`
- validar console sem `Maximum update depth exceeded`
- confirmar que abrir/fechar a busca não volta a travar a navegação

## Arquivos envolvidos
- `src/components/search/GlobalSearch.tsx` — correção principal
- possível leitura complementar apenas para validação:
  - `src/components/layout/AppSidebar.tsx`
  - `src/components/ui/sidebar.tsx`

## Resultado esperado
- Sidebar volta a navegar em qualquer clique
- App deixa de travar
- Busca global continua funcionando
- Console fica limpo do loop infinito

## Execução
Assim que você aprovar, eu faço:
1. correção cirúrgica em `GlobalSearch.tsx`
2. bateria de testes clicando no front
3. retorno com o resultado exato do que funcionou e do que foi validado
