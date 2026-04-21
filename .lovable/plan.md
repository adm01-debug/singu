
# Plano: Histórico de Mudanças de Tags de Interesse

## Objetivo

Registrar e exibir, na **Ficha 360**, um **histórico cronológico** de quando hobbies, interesses e valores (`top_values`) do contato foram **adicionados ou removidos**, mostrando data, autor e o diff (chip "+" verde / "−" vermelho), permitindo entender a evolução do perfil.

## Reutilização (zero schema novo)

- **Tabela `public.audit_log` já existe** (`entity_type`, `entity_id`, `action`, `old_data` JSONB, `new_data` JSONB, `user_id`, `created_at`) — vamos usá-la como única fonte de verdade.
- Memory `architecture/security/audit-trail`: triggers de auditoria já são o padrão para INSERT/UPDATE/DELETE.
- Memory `features/audit-trail-viewer`: já existe `/admin/audit-trail` com diff colorido — vamos **reaproveitar o padrão visual** numa visão focada em tags dentro da Ficha 360.

## Arquitetura

```text
Atualização de hobbies/interests/top_values em contacts
                ↓
   Trigger DB log_contact_tag_changes
                ↓
   audit_log(entity_type='contact_tags', entity_id=contact_id,
             action='update', old_data={hobbies,interests,top_values},
             new_data={hobbies,interests,top_values})
                ↓
   useContactTagsHistory(contactId) ← TanStack Query
                ↓
   HistoricoTagsCard (Ficha 360, dentro do grid esq.)
       ├─ Linha do tempo (últimos 20 eventos)
       ├─ Por evento: data relativa, autor, categoria
       └─ Diff: chips verdes (+ adicionados) / vermelhos (− removidos)
```

## Implementação

### 1. Migration: trigger de auditoria (banco externo via migration tool)

Criar função e trigger que detectam mudança em qualquer um dos 3 arrays (`hobbies`, `interests`, `top_values`) na tabela `contacts`:

```sql
create or replace function public.log_contact_tag_changes()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  changed boolean := false;
begin
  if coalesce(old.hobbies,    '{}') is distinct from coalesce(new.hobbies,    '{}') then changed := true; end if;
  if coalesce(old.interests,  '{}') is distinct from coalesce(new.interests,  '{}') then changed := true; end if;
  if coalesce(old.top_values, '{}') is distinct from coalesce(new.top_values, '{}') then changed := true; end if;
  if changed then
    insert into public.audit_log(entity_type, entity_id, action, old_data, new_data, user_id)
    values (
      'contact_tags', new.id, 'update',
      jsonb_build_object('hobbies', old.hobbies, 'interests', old.interests, 'top_values', old.top_values),
      jsonb_build_object('hobbies', new.hobbies, 'interests', new.interests, 'top_values', new.top_values),
      auth.uid()
    );
  end if;
  return new;
end$$;

create trigger trg_log_contact_tag_changes
after update of hobbies, interests, top_values on public.contacts
for each row execute function public.log_contact_tag_changes();
```

Backfill opcional **não** será feito (registra a partir do momento do trigger). Nota didática no card: "Histórico desde {primeira_data}".

### 2. Hook `useContactTagsHistory`

`src/hooks/useContactTagsHistory.ts` (≤120 linhas)

- TanStack Query, `staleTime` 5min
- `queryExternalData` em `audit_log` filtrado por `entity_type='contact_tags'` e `entity_id=contactId`, ordenado `created_at desc`, limite 30
- Função pura `diffArrays(oldArr, newArr)` retorna `{ added: string[], removed: string[] }`
- Mapeia eventos para `{ id, createdAt, userId, changes: { hobbies?, interests?, top_values?: {added, removed} } }`
- Filtra eventos onde nenhuma das 3 categorias teve mudança real (defesa)

### 3. Componente `HistoricoTagsCard`

`src/components/ficha-360/HistoricoTagsCard.tsx` (≤180 linhas)

- Card com ícone `History`, título "Evolução das Tags"
- Skeleton enquanto carrega
- **Empty state** explicativo: *"Nenhuma mudança registrada ainda. Alterações em hobbies, interesses e valores aparecerão aqui."*
- Lista vertical (timeline visual flat — pontinho + linha) dos últimos 10 eventos com botão "Ver mais" (mostra todos os 30)
- Por evento:
  - Cabeçalho: `formatDistanceToNow(created_at, ptBR)` + nome/email do autor (lookup opcional via `profiles` se disponível, senão "Sistema")
  - Para cada categoria mudada (Hobbies / Interesses / Valores), uma linha:
    - Label da categoria com ícone
    - Chips verdes "+ palavra" para `added`
    - Chips vermelhos "− palavra" para `removed` (com `line-through` opcional)
- `React.memo`

### 4. Integração em `Ficha360.tsx`

- Importar e renderizar `<HistoricoTagsCard contactId={id} />` na **coluna esquerda**, logo abaixo de `TagsInteresseCard` (vizinhança semântica perfeita)

### 5. Padrões obrigatórios

- PT-BR
- `Array.isArray()` defensivo nos arrays do JSONB
- Sem `any`, sem `dangerouslySetInnerHTML`
- Tokens semânticos: `success` para adicionados, `destructive` para removidos
- Flat design (sem sombras/gradientes)
- Diff puro (sem dependência de libs externas)

## Arquivos tocados

**Migration (1):**
- Função `log_contact_tag_changes()` + trigger `trg_log_contact_tag_changes` em `contacts`

**Novos (2):**
- `src/hooks/useContactTagsHistory.ts`
- `src/components/ficha-360/HistoricoTagsCard.tsx`

**Editados (1):**
- `src/pages/Ficha360.tsx` — incluir card abaixo de `TagsInteresseCard`

## Critério de fechamento

(a) Trigger ativa em `contacts` registrando mudanças em `hobbies/interests/top_values` em `audit_log`, (b) card "Evolução das Tags" visível na coluna esquerda da Ficha 360 abaixo das tags atuais, (c) lista cronológica dos últimos 10 eventos (com expansão até 30) com data relativa e autor, (d) diff visual com chips verdes (adicionados) e vermelhos (removidos) por categoria, (e) empty state explicativo quando ainda não há histórico, (f) zero regressão nos demais cards e zero novas tabelas criadas.
