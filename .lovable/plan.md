

# Plano: Ativar Optimistic Locking na Camada de UI

## Problema identificado

O optimistic locking está implementado em todas as camadas (Edge Function, lib, hooks, toast), **mas a UI nunca ativa o mecanismo**. As chamadas `updateContact(id, data)` e `updateCompany(id, data)` nunca passam o terceiro argumento `expectedVersion`, fazendo o hook cair sempre no branch `updateExternalData` (sem versão). Resultado: o toast de conflito nunca aparece.

## Ações

**1. Passar `version` nas chamadas de edição de Contatos**

Em `src/pages/Contatos.tsx`, no `handleUpdate`, extrair a versão do contato sendo editado e passá-la:

```ts
const result = await updateContact(
  editingContact.id,
  data,
  editingContact.version  // ativa optimistic locking
);
```

Fazer o mesmo em `ContatoDetalhe` (aba Dados) se houver edição inline.

**2. Passar `version` nas chamadas de edição de Empresas**

Em `src/pages/Empresas.tsx`, no `handleUpdate`:

```ts
const result = await updateCompany(
  editingCompany.id,
  data,
  editingCompany.version
);
```

**3. Verificar que `version` é retornado pelo backend**

Confirmar que a query `select` do `external-data` retorna o campo `version` nos registros de `contacts` e `companies`. Se não existir a coluna no banco externo, criar via migration.

**4. Teste manual E2E**

Após as correções, testar abrindo o mesmo contato em duas abas, editando em ambas, e confirmando que a segunda edição dispara o toast "Edição concorrente detectada" com botão "Recarregar".

## Arquivos tocados

- `src/pages/Contatos.tsx` (1 linha — adicionar `editingContact.version`)
- `src/pages/Empresas.tsx` (1 linha — adicionar `editingCompany.version`)
- Possivelmente componentes de edição inline no detalhe do contato/empresa
- Migration SQL se coluna `version` não existir nas tabelas externas

## Critério de sucesso

(a) Edição normal funciona passando a versão, (b) segunda edição com versão obsoleta gera toast de conflito com ação "Recarregar", (c) zero regressão em edições sem conflito.

