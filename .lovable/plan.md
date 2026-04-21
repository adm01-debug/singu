

# Plano: Agendar reunião sem mudar de tela (criar evento + convite)

## Contexto

Hoje, no passo `agendar-reuniao` da Ficha 360, o usuário tem:
- Botão "Criar tarefa" (cria task genérica)
- Botão "Copiar script" (gera mensagem de convite)
- Botão "Feito" (registra outcome)

Falta o caminho direto: **criar a reunião como evento real** (na tabela `meetings` do banco externo, com data/hora/duração) e **gerar a mensagem de convite já com data confirmada**, copiável em um clique. Tudo inline, sem sair da Ficha 360.

## Decisão de escopo

- Aproveitar a tabela `meetings` já existente no banco externo (campos: `contact_id`, `company_id`, `title`, `scheduled_at`, `duration_minutes`, `meeting_url`, `notes`, `status`).
- Persistência via `insertExternalData('meetings', ...)` (mesmo padrão dos outros hooks externos).
- UI: substituir "Criar tarefa" **apenas no passo `agendar-reuniao`** por um formulário inline `Agendar reunião` mais rico (data, hora, duração, modalidade, link). Demais passos continuam com `ProximoPassoQuickForm`.
- Geração da mensagem: reusar `scriptGenerator` mas com um **modo "convite confirmado"** que injeta a data/hora/duração no texto pronto para WhatsApp/E-mail.

## Implementação

### 1. Novo hook `src/hooks/useCreateMeeting.ts` (~70 linhas)

```ts
export interface CreateMeetingPayload {
  contactId: string;
  companyId?: string | null;
  title: string;
  scheduledAt: string;          // ISO
  durationMinutes: number;      // 15/30/45/60/90
  meetingType?: 'video' | 'presencial' | 'phone';
  meetingUrl?: string | null;
  notes?: string | null;
}

export function useCreateMeeting()  // useMutation → insertExternalData('meetings', ...)
```

- Invalida `['contact-meetings', contactId]` e `['company-meetings', companyId]` no sucesso.
- Status default `scheduled`.

### 2. Novo helper em `src/lib/scriptGenerator.ts` (~50 linhas adicionais)

```ts
export interface MeetingInviteContext {
  firstName: string;
  scheduledAt: Date;
  durationMinutes: number;
  modality: 'video' | 'presencial' | 'phone';
  meetingUrl?: string | null;
  sentiment?: SentimentTone;
}

export function generateMeetingInvite(ctx: MeetingInviteContext): {
  whatsapp: string;
  email: { subject: string; body: string };
};
```

- Modulado por sentimento (mantém o tom já estabelecido: direto/cordial/empático).
- Inclui data formatada PT-BR (ex: "quinta, 24/04 às 14:00") e duração ("30 min").
- Se `modality === 'video'` e tem `meetingUrl`, adiciona linha "Link: {url}".
- Se `modality === 'presencial'`, adiciona "Local: a confirmar".

### 3. Novo componente `src/components/ficha-360/AgendarReuniaoForm.tsx` (~220 linhas)

Form inline (substitui o `ProximoPassoQuickForm` quando `passo.id === 'agendar-reuniao'`):

**Estado 1 — Formulário (aberto inicialmente):**
- Grid 2 colunas:
  - **Data** `<Input type="date">` — default: próximo dia útil
  - **Hora** `<Input type="time" step="900">` — default: 10:00 (ou bestTime se válido)
  - **Duração** `<Select>` — 15/30/45/60/90 min, default 30
  - **Modalidade** `<Select>` — Vídeo / Presencial / Telefone, default Vídeo
- Se Vídeo: `<Input>` opcional "Link da reunião (Meet/Zoom)" — placeholder "Cole após criar"
- `<Textarea>` opcional "Notas internas" (max 200 chars)
- Linha hint: "Reunião com {nome} em {data formatada PT-BR} • {duração}"
- Rodapé: `Confirmar agendamento` (primary, com Loader2) + `Cancelar` (ghost)

**Estado 2 — Pós-criação (após sucesso):**
- Card discreto verde com `<Check />` "Reunião agendada para {data} às {hora}"
- Tabs WhatsApp / E-mail com mensagem de convite **já preenchida com a data confirmada**
- Botão `Copiar mensagem` (toast: "Convite copiado")
- Botão `Concluído` que fecha o form
- (Mensagem usa `generateMeetingInvite` com a data/hora salvas)

### 4. Refatorar `ProximosPassosCard.tsx`

- Quando expandido E `p.id === 'agendar-reuniao'` → renderizar `<AgendarReuniaoForm passo={p} contactId={contactId} companyId={companyId} firstName={resolvedFirstName} sentiment={sentiment} bestTime={bestTime} onCreated={...} onCancel={...} />`.
- Caso contrário → mantém `<ProximoPassoQuickForm>` atual.
- Adicionar prop `companyId?: string` para repassar.
- Após `onCreated`: badge "✓ Reunião agendada" por 4s (reusa `createdIds`).

### 5. Integração em `src/pages/Ficha360.tsx`

- Passar `companyId={profile?.company_id ?? null}` ao `<ProximosPassosCard>`.
- Sem novas queries.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow/gradient)
- `React.memo` no form
- Reuso de `insertExternalData` (mesmo padrão de `useContacts`)
- Zero novas queries de rede em estado idle
- Backward compat: outros passos não são afetados

## Arquivos tocados

**Criados (2):**
- `src/hooks/useCreateMeeting.ts`
- `src/components/ficha-360/AgendarReuniaoForm.tsx`

**Editados (3):**
- `src/lib/scriptGenerator.ts` — adicionar `generateMeetingInvite`
- `src/components/ficha-360/ProximosPassosCard.tsx` — branching p/ `agendar-reuniao` + prop `companyId`
- `src/pages/Ficha360.tsx` — passar `companyId`

## Critério de fechamento

(a) No passo `agendar-reuniao`, clicar "Agendar" expande form com data/hora/duração/modalidade pré-preenchidos, (b) confirmar cria registro em `meetings` (via `insertExternalData`) com `scheduled_at`, `duration_minutes`, `meeting_type`, `meeting_url`, `notes` e invalida cache `['contact-meetings']`, (c) após sucesso o form mostra abas WhatsApp/E-mail com mensagem de convite já contendo a data formatada PT-BR e duração, modulada por sentimento, (d) botão "Copiar mensagem" copia o texto pronto e dispara toast, (e) badge "✓ Reunião agendada" aparece no item por 4s, (f) zero regressão nos demais passos (`Criar tarefa`, `Copiar script`, `Feito`), no `ProximaAcaoCTA` ou no `useContactMeetings`, (g) PT-BR, tokens semânticos, flat.

