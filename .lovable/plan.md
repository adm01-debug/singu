
# Plano: Scripts multi-canal modulados por sentimento e horário

## Contexto

Hoje cada `ProximoPasso` tem um único `scriptHint` (texto curto, sem variação por canal). O botão "Copiar script" copia esse texto único. Faltam:
1. Variantes por **canal** (WhatsApp informal, E-mail formal com assunto, Roteiro de ligação com bullets).
2. Modulação por **sentimento** do contato (positivo/neutro/negativo) — abertura, tom e CTA mudam.
3. Uso do **melhor horário** (`bestTime`) como referência ("posso te ligar amanhã às 14h?").
4. UI para escolher canal antes de copiar.

## Decisão de escopo

- **Geração 100% client-side determinística** (sem chamada de IA, instantâneo, zero custo). Já temos sentimento em `profile.sentiment` e `bestTime` em cache.
- **3 canais fixos**: WhatsApp, E-mail, Ligação. LinkedIn/Reunião reaproveitam o template de e-mail.
- **Reaproveita o estado de simulação**: se Modo de Testes estiver ativo, scripts usam o sentimento simulado (coerente com o resto da Ficha 360).
- **Substitui** o `scriptHint` único por um menu/popover de 3 abas. Botão "Copiar" continua existindo, agora com escolha de canal.

## Implementação

### 1. Novo helper: `src/lib/scriptGenerator.ts` (~180 linhas)

Função pura:

```ts
export type ScriptChannel = 'whatsapp' | 'email' | 'call';
export type SentimentTone = 'positivo' | 'neutro' | 'negativo' | 'misto' | null;

export interface ScriptContext {
  passoId: string;          // 'reabrir-conversa' | 'agendar-reuniao' | etc
  firstName: string;
  sentiment: SentimentTone;
  bestTime?: string | null; // ex: "manhã" ou "14:00"
  daysSinceLast?: number | null;
  cadenceDays?: number | null;
}

export interface GeneratedScript {
  channel: ScriptChannel;
  subject?: string;          // só para email
  body: string;              // texto pronto p/ colar
  toneLabel: string;         // ex: "Cordial", "Empático", "Direto"
}

export function generateScripts(ctx: ScriptContext): GeneratedScript[];
```

**Lógica de modulação por sentimento:**
- **Positivo**: tom direto, CTA forte ("vamos avançar").
- **Neutro/sem dado**: cordial, com curiosidade ("como você está vendo isso?").
- **Negativo/misto**: empático, sem pressão, abre espaço ("queria entender se algo mudou de prioridade").

**Lógica por canal:**
- **WhatsApp**: 1–2 frases, emoji moderado, sem assunto, menciona horário se conveniente ("posso te ligar {bestTime}?").
- **E-mail**: assunto + saudação + corpo de 3 parágrafos + assinatura placeholder. Inclui contexto (dias sem contato, cadência).
- **Ligação**: roteiro em bullets ("Abertura: ...", "Pergunta-chave: ...", "Próximo passo: ..."), não é texto para enviar.

**Variação por `passoId`** (templates específicos para cada um dos 7 passos do `proximosPassos.ts`: `reabrir-conversa`, `agendar-reuniao`, `whatsapp-followup`, `retomar-email`, `aniversario`, `pedir-feedback`, `checkin-leve`).

### 2. Novo componente: `src/components/ficha-360/CopyScriptMenu.tsx` (~120 linhas)

Popover com 3 tabs (WhatsApp / E-mail / Ligação):
- **Trigger**: Button "Copiar script" (mesmo visual atual) + chevron.
- **Header da aba ativa**: badge com tom ("Empático" / "Direto" / "Cordial") + ícone do canal.
- **E-mail**: mostra "Assunto:" em destaque + corpo num `<Textarea readOnly>` pequeno.
- **WhatsApp/Ligação**: `<Textarea readOnly>` único.
- **Rodapé**: 2 botões — `Copiar` (copia body, ou subject+body para email) e `Copiar só o assunto` (visível apenas no e-mail).
- Toast: "Script de {canal} copiado".
- `React.memo`, PT-BR, tokens semânticos, flat.

### 3. Refatorar `ProximosPassosCard.tsx`

- Receber `profile` e `bestTime` (já tem) para passar `sentiment` e `bestTime` ao menu.
- Substituir o botão atual `Copiar script` por `<CopyScriptMenu passo={p} firstName={firstName} sentiment={sentiment} bestTime={bestTime?.hour_of_day ? formatHour(...) : intelligence.best_time} />`.
- Manter `scriptHint` como **fallback** (compat retroativa) caso o gerador retorne array vazio para um id desconhecido.
- Adicionar prop `firstName` e `sentiment` ao `Props`.

### 4. Integração: `src/pages/Ficha360.tsx`

- Passar `firstName={effectiveProfile?.first_name ?? fullName.split(' ')[0]}` e `sentiment={effectiveProfile?.sentiment as SentimentTone ?? null}` para `ProximosPassosCard` (usa `effectiveProfile` para respeitar simulação).
- `bestTime` já é passado.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos (sem cores fixas)
- Flat (sem shadow/gradient)
- `React.memo` no menu
- Zero novas queries de rede (geração local determinística)
- Sem chamadas de IA — instantâneo
- Backward compat: `scriptHint` permanece como fallback

## Arquivos tocados

**Criados (2):**
- `src/lib/scriptGenerator.ts`
- `src/components/ficha-360/CopyScriptMenu.tsx`

**Editados (2):**
- `src/components/ficha-360/ProximosPassosCard.tsx` — substituir botão Copiar por menu, novas props
- `src/pages/Ficha360.tsx` — passar `firstName` e `sentiment` (do `effectiveProfile`)

## Critério de fechamento

(a) Cada item de "Próximos Passos" tem botão "Copiar script" que abre popover com 3 abas (WhatsApp, E-mail, Ligação), (b) cada aba mostra texto pronto modulado por sentimento (positivo→direto, neutro→cordial, negativo→empático) e referenciando `bestTime` quando aplicável, (c) aba de E-mail tem campo separado de Assunto + corpo com 3 parágrafos e botão "Copiar só o assunto", (d) aba de Ligação mostra roteiro em bullets (Abertura/Pergunta-chave/Próximo passo), (e) botão `Copiar` copia o body (ou subject+body do e-mail) e dispara toast "Script de {canal} copiado", (f) Modo de Testes ativo afeta o sentimento usado nos scripts (coerência com simulação), (g) zero novas queries de rede e zero chamadas de IA, (h) zero regressão no formulário rápido de tarefa, no `ProximaAcaoCTA` ou no `NextBestActionCard` da `ContatoDetalhe`, (i) PT-BR, tokens semânticos, flat.
