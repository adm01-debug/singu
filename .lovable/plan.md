
# Plano: Formulário rápido por sugestão em "Próximos Passos" com data/hora e canal pré-preenchidos

## Contexto

Hoje, em `ProximosPassosCard`, cada sugestão tem um botão "Criar tarefa" que dispara `useCreateTask` com `title`, `description`, `priority` e `task_type`, **sem data/hora** — a tarefa nasce sem `due_date`. O canal já vem da regra (ex.: `whatsapp`, `meeting`), mas o usuário não consegue ajustar nada antes de salvar.

Vamos transformar cada item em um **mini-formulário expansível** (Collapsible), pré-preenchido com canal recomendado, data sugerida (baseada em prioridade) e horário (vindo de `useBestContactTime`), permitindo ajuste rápido antes de criar.

## Decisões de pré-preenchimento

### Canal
- Usa `passo.channel` (já vem da regra: cadência, follow-up, aniversário, etc.).
- Editável via `Select` com as 5 opções: WhatsApp, E-mail, Ligação, Reunião, LinkedIn.

### Data sugerida (heurística determinística)
- **`alta`** → hoje (se ainda dá tempo no dia, senão amanhã).
- **`media`** → amanhã.
- **`baixa`** → daqui a 3 dias.
- Casos especiais por `passo.id`:
  - `aniversario` → data exata do aniversário (extrai dias do detalhe; se "hoje", hoje).
  - `agendar-reuniao` → próximo dia útil às 10h.
  - `whatsapp-followup` → hoje no horário ótimo.

### Horário sugerido
- Se `useBestContactTime(contactId)` retorna `hour_of_day` válido → usa esse horário (ex.: 14:00).
- Senão fallback por canal: `meeting` 10:00, `call` 14:00, `whatsapp/email/linkedin` 09:00.
- Se `bestTime.day_of_week` bate com algum dia próximo dentro de 7 dias e a prioridade não é `alta`, ajusta a data para esse dia (otimiza recomendação).

Lógica isolada em `src/lib/proximoPassoDefaults.ts` (função pura, testável).

## Implementação

### 1. Novo helper: `src/lib/proximoPassoDefaults.ts` (~80 linhas)

```ts
export interface BestTimeHint {
  day_of_week?: number | null;
  hour_of_day?: number | null;
}

export interface PassoDefaults {
  date: string;        // yyyy-MM-dd
  time: string;        // HH:mm
  channel: ProximoPassoChannel;
  dueDateIso: string;  // ISO completo combinando date+time
}

export function computePassoDefaults(
  passo: ProximoPasso,
  bestTime: BestTimeHint | null | undefined,
  now: Date = new Date(),
): PassoDefaults
```

- Retorna data/hora/canal coerentes com prioridade + bestTime + tipo de passo.
- Combina date+time em ISO local (`new Date(yyyy, mm-1, dd, HH, MM).toISOString()`).

### 2. Novo subcomponente: `src/components/ficha-360/ProximoPassoQuickForm.tsx` (~180 linhas)

Form inline (renderizado dentro de cada `<li>` quando expandido):

- **Layout grid 2 cols** (responsivo: 1 col em mobile):
  - **Data**: `<Input type="date">` (Shadcn input, min=hoje).
  - **Hora**: `<Input type="time">` step=900 (15 min).
  - **Canal**: `<Select>` com 5 opções + ícones, default = `passo.channel`.
  - **Prioridade**: `<Select>` (Alta/Média/Baixa) default = `passo.priority`.
- **Linha de hint** (text-xs muted): "Sugerido: {canal} em {data formatada} às {hora}{ • baseado no melhor horário do contato | quando aplicável}".
- **Rodapé** com 2 botões:
  - `Confirmar` (primary, com Loader2 quando pending) → chama `useCreateTask` com `due_date: dueDateIso`, `task_type: channel`, `priority`, `title`, `description`.
  - `Cancelar` (ghost) → fecha o form.
- Após sucesso: toast "Tarefa criada para {data} às {hora}", form fecha, item ganha badge "✓ Tarefa criada" por 4s (estado local).
- `React.memo`, PT-BR, tokens semânticos, flat.

### 3. Refatorar `src/components/ficha-360/ProximosPassosCard.tsx`

- Adicionar prop `bestTime?: BestTimeHint` (vinda de `useBestContactTime` no `Ficha360`).
- Estado `expandedId: string | null` (apenas um form aberto por vez).
- Estado `createdIds: Set<string>` para badge "Tarefa criada".
- Substituir o botão único `Criar tarefa` por:
  - Botão `Criar tarefa` que **abre o form** (toggle do `expandedId`) com chevron.
  - Quando expandido, renderiza `<ProximoPassoQuickForm passo={p} bestTime={bestTime} contactId={contactId} onCreated={() => { setExpandedId(null); setCreatedIds(prev => new Set(prev).add(p.id)); }} onCancel={() => setExpandedId(null)} />`.
- Botão `Copiar script` permanece igual.
- Remover o `handleCreateTask` antigo / `busyId` (movido para o form).

### 4. Integração: `src/pages/Ficha360.tsx`

- Importar `useBestContactTime`.
- `const { data: bestTime } = useBestContactTime(id);` (já é cacheado pelo `ProximaAcaoCTA`, então é a mesma queryKey — zero query nova).
- Passar `bestTime` para `<ProximosPassosCard ... bestTime={bestTime} />`.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow/gradient)
- `React.memo` no quick form
- Zero novas queries de rede (`useBestContactTime` já é chamado pelo `ProximaAcaoCTA` na mesma página → cache hit)
- Reaproveita `useCreateTask` existente
- Formulário inline (Collapsible), não modal — fluxo "edit-in-place" sem perder contexto
- Backward compat: `ProximosPassosCard` aceita `bestTime` como opcional

## Arquivos tocados

**Criados (2):**
- `src/lib/proximoPassoDefaults.ts`
- `src/components/ficha-360/ProximoPassoQuickForm.tsx`

**Editados (2):**
- `src/components/ficha-360/ProximosPassosCard.tsx` — abrir form inline + estado de expansão + badge "criada"
- `src/pages/Ficha360.tsx` — passar `bestTime` ao card

## Critério de fechamento

(a) Cada item de "Próximos Passos" tem botão "Criar tarefa" que **expande inline** um form com 4 campos: data, hora, canal, prioridade — todos pré-preenchidos, (b) data padrão segue heurística por prioridade (alta=hoje, média=amanhã, baixa=+3d) com casos especiais (aniversário usa data exata, reunião próximo dia útil 10h), (c) hora padrão vem de `useBestContactTime` quando disponível, com fallback por canal, (d) canal padrão vem do `passo.channel` mas pode ser ajustado, (e) confirmar cria tarefa via `useCreateTask` com `due_date` ISO combinado + `task_type` + `priority`, (f) toast "Tarefa criada para {data} às {hora}", form fecha, item ganha badge "✓ Tarefa criada" por 4s, (g) cancelar fecha sem criar, (h) só um form aberto por vez (acordeon), (i) zero novas queries de rede, (j) zero regressão no botão "Copiar script", no `ProximaAcaoCTA` ou no fluxo de simulação.
