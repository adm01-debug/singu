
# Plano: CTA "Próxima ação sugerida" na Ficha 360

## Contexto

Já existe `NextBestActionCard` (usado em `ContatoDetalhe`) que consome a edge function `next-best-action` e gera ação acionável com canal, urgência, script, resultado esperado e botão "Criar tarefa". Também existe `useBestContactTime(contactId)` que retorna `day_of_week` + `hour_of_day` + `success_rate` + `suggested_channel`.

A Ficha 360 (`src/pages/Ficha360.tsx`) hoje mostra `ScoreProntidaoCard` com `recommendation` + `nextActionHint` em texto, mas **não tem CTA acionável** — falta o componente unificado que combine: ação IA + melhor horário + botão para registrar a interação direto no CRM.

## Implementação

### 1. Novo componente: `src/components/ficha-360/ProximaAcaoCTA.tsx` (~180 linhas)

Card destacado (variant `outlined`, header com ícone `Sparkles`) que combina três fontes:

**Props:**
```ts
{ contactId: string; contactName: string }
```

**Composição interna:**
- `useNextBestAction(contactId)` — ação IA (canal, urgência, script, expected_outcome)
- `useBestContactTime(contactId)` — melhor horário sugerido
- `useCreateQuickInteraction()` — registrar interação no CRM

**Estados de UI:**

a) **Empty state** (sem `nextAction`): bloco com `Sparkles` + título "Próxima ação sugerida" + texto "Gere uma sugestão de IA combinando canal ideal e melhor horário" + `LoadingButton` "Gerar sugestão" (variant gradient).

b) **Loaded state**:
- Header: badges de urgência (`high|medium|low` → destructive/default/secondary) + canal (ícone + label PT-BR via `channelMeta` reutilizado de `NextBestActionCard`).
- **Linha de ação principal** (texto destacado `text-base font-semibold`): `nextAction.action`.
- **Justificativa** (`text-sm text-muted-foreground`): `nextAction.reason`.
- **Bloco "Melhor horário"** (quando `bestTime` disponível, em `bg-muted/40 rounded-md p-3` com ícone `Clock`):
  - Texto: `"Melhor horário: {dayLabel} às {hour}h"` (mapear `day_of_week` 0-6 → `['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']`)
  - Subtexto: `"Taxa de resposta histórica: {success_rate}%"` quando disponível
  - Se `suggested_channel` ≠ `nextAction.channel`, exibir aviso sutil: "Canal sugerido pelo histórico: {x}"
- **Script collapsible** (reutilizar padrão de `NextBestActionCard`): toggle "Ver script sugerido" com botão "Copiar script".
- **Resultado esperado** (rodapé compacto, border-top): `nextAction.expected_outcome`.
- **Footer com 3 botões**:
  - `Regenerar` (ghost, ícone `RefreshCw`) → `generate()`
  - `Criar tarefa` (outline, ícone `CheckCircle2`) → `createTask` (igual ao card existente)
  - **`Registrar interação`** (default, ícone `Zap`) → abre painel inline com `Input` (resumo pré-preenchido com `nextAction.action`) + `Select` de tipo (default = `nextAction.channel` mapeado: email/whatsapp/call/meeting/note) → ao confirmar chama `createInteraction.mutateAsync({ p_contact_id, p_tipo, p_resumo })` e mostra toast "Interação registrada!". Após sucesso, opcionalmente disparar `generate()` para refrescar a próxima ação com base no novo histórico.

**Padrões:**
- PT-BR
- Tokens semânticos
- Flat (sem shadow/gradient pesado, exceto botão "Gerar sugestão" que pode usar `gradient`)
- `React.memo`
- Reaproveitar `channelMeta`/`urgencyMeta` (extrair para `src/lib/interactionChannels.ts` se for limpar duplicação, ou duplicar localmente para manter componentes desacoplados — preferência: duplicar pequeno objeto local)
- Zero novas queries de rede além das já existentes (`useNextBestAction`, `useBestContactTime`)

### 2. Integração: `src/pages/Ficha360.tsx`

Localizar onde `ScoreProntidaoCard` é montado (linha ~174) e inserir `<ProximaAcaoCTA contactId={id} contactName={contact?.name ?? 'contato'} />` **logo abaixo**, na mesma coluna do score. Manter hierarquia visual: Score → Próxima Ação → demais cards.

### 3. Verificar reuso de `useCreateQuickInteraction`

A RPC `create_quick_interaction` aceita `p_contact_id` (já confirmado em `QuickActionsWidget` que passa `p_company_id`). Validar a assinatura no hook — se não aceitar `p_contact_id`, usar a mutation equivalente já existente para contatos (provavelmente mesma RPC com parâmetro alternativo). Se necessário, fallback para `useCreateInteraction` direto na tabela.

## Arquivos tocados

**Criado (1):**
- `src/components/ficha-360/ProximaAcaoCTA.tsx`

**Editado (1):**
- `src/pages/Ficha360.tsx` — montar `ProximaAcaoCTA` abaixo de `ScoreProntidaoCard`

## Critério de fechamento

(a) Novo card "Próxima ação sugerida" aparece na Ficha 360 logo abaixo do Score de Prontidão, (b) empty state com botão "Gerar sugestão" gera ação via IA em <8s, (c) card carregado mostra ação principal + justificativa + badges de urgência/canal + bloco "Melhor horário: {dia} às {hora}h" quando disponível, (d) script colapsável com botão copiar, (e) 3 botões no rodapé: Regenerar, Criar tarefa, Registrar interação, (f) clicar "Registrar interação" abre painel inline com resumo pré-preenchido + tipo derivado do canal e ao confirmar grava no CRM com toast de sucesso, (g) divergência entre canal IA e canal sugerido pelo histórico aparece como aviso sutil, (h) PT-BR, tokens semânticos, flat, sem novas queries além das existentes, (i) zero regressão no `NextBestActionCard` da `ContatoDetalhe` ou no `ScoreProntidaoCard`.
