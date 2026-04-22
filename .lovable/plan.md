

# Plano: Filtro por pessoa e por cargo nas interações da empresa

## Reinterpretação justificada do pedido

Na Ficha 360, todas as interações já são de **uma única pessoa** (o contato da página) — filtrar por pessoa/cargo aqui não restringe nada. O lugar onde esse filtro faz sentido é **`/empresa/:id` → aba Interações** (`CompanyInteractionsTab`), onde aparecem interações de **múltiplos contatos da mesma empresa** (compradores, gerentes, proprietários etc.). É lá que o usuário vê uma timeline misturada e precisa restringir.

A tab hoje é uma simples lista, **sem nenhum filtro**. Vamos torná-la inteligente: filtro por pessoa e por papel (`ContactRole`) no topo, com chips de pessoas presentes e dropdown de papéis.

## Mudanças

### 1. `CompanyInteractionsTab.tsx` — receber `contacts` e adicionar filtros

Hoje recebe só `interactions: Interaction[]`. Passa a também receber `contacts: Contact[]` (`EmpresaDetalhe.tsx` já tem `contacts` em mãos — basta passar adiante).

Estado interno:
- `selectedContactId: string | null` — filtro por pessoa específica.
- `selectedRoles: ContactRole[]` — filtro multi-select por papel (compradores, gerentes, proprietários, decisores, influenciadores).

Aplicação: `interactions.filter(i => (!selectedContactId || i.contact_id === selectedContactId) && (selectedRoles.length === 0 || selectedRoles.includes(contactById[i.contact_id]?.role)))`.

Persistência em URL via `useSearchParams`: `?pessoa=<contactId>` e `?papeis=owner,manager` (ambos omitidos quando default). Whitelist de papéis usando o tipo `ContactRole` exportado de `@/types`.

### 2. Novo: `src/components/company-detail/InteracoesPessoaCargoBar.tsx` (~150 linhas)

Barra de filtros compacta no topo da tab:

```
Pessoa: [👤 Todas ▾]   Papel: [🏷 Todos ▾]   3 de 24 interações   [Limpar]
```

- **Dropdown "Pessoa"**: avatar + nome + `RoleBadge` para cada contato com pelo menos 1 interação no conjunto. Item "Todas" reseta. Conta entre parênteses por contato (`João (8)`).
- **Dropdown "Papel"** (multi-select com checkboxes): lista os papéis que **existem** entre os contatos da empresa (omite papéis sem ninguém). Reusa labels do `roleConfig` em `RoleBadge`. Mostra checkmark + label PT-BR.
- **Resumo**: "X de Y interações" alinhado à direita.
- **Limpar**: aparece só quando há filtro ativo.

A11y: `role="group"` + `aria-label="Filtros por pessoa e cargo"`. Cada dropdown com `aria-label` próprio. Itens com checkbox usam `role="menuitemcheckbox"` + `aria-checked`.

### 3. `EmpresaDetalhe.tsx` — passar `contacts` para a tab

Mudança de 1 linha em `<CompanyInteractionsTab interactions={interactions} contacts={contacts} />`.

### 4. Chips ativos inline (não barra separada)

Quando há filtro aplicado, exibir chips fechaveis logo abaixo dos dropdowns:
- `👤 João Silva ×` (clica × → reseta `pessoa`)
- `🏷 Comprador ×` `🏷 Gerente ×` (× remove daquele papel)

Usa `Badge` existente com `closeable`.

### 5. Empty state diferenciado

Quando `interactions.length > 0` mas `filtered.length === 0` (filtros eliminaram tudo), substituir o empty state genérico por:

> "Nenhuma interação para esses filtros."  
> Botão "Limpar filtros" → reseta tudo.

### 6. Discoverability na Ficha 360 (mínimo)

Como o usuário pediu "dentro da empresa", o link `ConversasRelacionadasCard` (que já existe na Ficha 360) ganha um chip extra:

- **"Ver interações da empresa por pessoa"** → `/empresa/{companyId}?tab=interactions` (tab params já é suportado pelo `Tabs` do EmpresaDetalhe).

Só renderizado quando `profile.company_id` existe. Fica visível, não intrusivo.

## Não muda

- `useExternalInteractions`, `useFicha360Filters`, atalhos, favoritos, `OrdenacaoToggle`, `ContagemPorTipoBar` — escopo Ficha 360 intacto.
- Tabela `interactions`, RLS, edge functions.
- `/interacoes` global (já tem seu próprio filtro avançado).
- O comportamento default da tab "Interações" da empresa quando ninguém aplicou filtro.

## Critérios de aceite

(a) Em `/empresa/:id` aba "Interações", aparecem dois dropdowns no topo: "Pessoa" e "Papel"; (b) "Pessoa" lista contatos com interações + contagem; "Papel" multi-select dos cargos presentes; (c) seleção filtra a lista imediatamente, com resumo "X de Y"; (d) chips fechaveis aparecem para cada filtro ativo abaixo dos dropdowns; (e) URL sincroniza via `?pessoa=<id>&papeis=owner,manager` (omitidos quando vazio); (f) empty state específico quando filtros eliminam tudo, com "Limpar"; (g) na Ficha 360, `ConversasRelacionadasCard` ganha chip "Interações da empresa por pessoa" linkando para a empresa do contato (oculto se sem `company_id`); (h) sem nova dependência, sem `any`, PT-BR, flat, novo arquivo <150 linhas; (i) acessibilidade: `role="group"`, `aria-label`, `menuitemcheckbox` nos papéis.

