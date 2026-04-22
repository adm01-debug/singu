

# Plano: Botão "Gerar resumo IA" sobre interações filtradas

## Contexto

Hoje em **Ficha 360 → Últimas Interações** o usuário aplica filtros (período, canais, tags, busca, ordenação) e vê uma lista. Falta um botão que sintetize **as interações atualmente filtradas** + dados do contato em um resumo executivo: perfil da pessoa, histórico de conversas, decisões, próximos passos e sinais de relacionamento.

Já existe a edge function `meeting-summary` (resume 1 interação) e `useMeetingSummary` (hook). Não serve aqui — precisamos resumir **N interações + perfil**, com escopo configurável pelos filtros do usuário. Vamos criar uma nova função `ficha360-conversation-summary`.

## Mudanças

### 1. Nova edge function: `supabase/functions/ficha360-conversation-summary/index.ts` (~180 linhas)

- `Deno.serve()` + `withAuth` + `rateLimit` (compartilhados de `_shared/`).
- Rate limit: 10 req/min por usuário (alinhado a `conversation-coaching-digest`).
- Validação Zod do body:
  ```ts
  {
    contact_id: string (uuid),
    interaction_ids: string[] (1..200),
    contact_snapshot: { full_name, role_title?, company_name?, disc_profile?, hobbies?[], interests?[] },
    filters_summary: { period_days?, channels?[], tags?[], query? } // só para contexto no prompt
  }
  ```
- Carrega as interações do banco externo via proxy `external-data` (ação `read_query` na view `vw_interaction_timeline`) restritas aos `interaction_ids` informados e ao `user_id` autenticado (RLS via service role + WHERE explícito).
- Trunca conteúdo: máx 200 interações, máx 800 chars de `assunto+resumo` por item.
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) via **tool calling** para output estruturado:
  ```ts
  {
    perfil_resumido: string,           // 2-3 frases sobre quem é a pessoa
    estilo_comunicacao: string,        // tom, frequência, canal preferido
    topicos_principais: string[],      // 3-6 temas recorrentes
    decisoes_acordos: string[],        // o que foi decidido / acordado
    pendencias: { item: string, prazo_estimado?: string }[],
    sinais_relacionamento: { tipo: 'positivo' | 'atencao' | 'negativo', descricao: string }[],
    proximos_passos_sugeridos: string[],
    risco_churn: 'baixo' | 'medio' | 'alto',
    confianca_analise: number          // 0-100, baseado em volume/qualidade dos dados
  }
  ```
- Retorna `{ summary, model, generated_at, interactions_analyzed }`.
- Persiste em nova tabela `ficha360_conversation_summaries` (ver §2) para cache + histórico.
- Tratamento explícito de 402 / 429 / erro de IA com mensagens PT-BR.

### 2. Migração: tabela `ficha360_conversation_summaries`

```sql
CREATE TABLE public.ficha360_conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  filters_hash text NOT NULL,           -- sha256 dos filtros + interaction_ids ordenados
  interaction_ids uuid[] NOT NULL,
  filters_summary jsonb NOT NULL,
  summary jsonb NOT NULL,
  model text NOT NULL,
  interactions_analyzed integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_f360_summ_user_contact ON public.ficha360_conversation_summaries (user_id, contact_id, created_at DESC);
CREATE INDEX idx_f360_summ_hash ON public.ficha360_conversation_summaries (user_id, contact_id, filters_hash);

ALTER TABLE public.ficha360_conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own summaries"
  ON public.ficha360_conversation_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own summaries"
  ON public.ficha360_conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own summaries"
  ON public.ficha360_conversation_summaries FOR DELETE
  USING (auth.uid() = user_id);
```

Cache: a edge function calcula `filters_hash`, faz `SELECT` antes de chamar a IA. Se hit < 24h → devolve cache. Senão, gera novo e insere.

### 3. Novo hook: `src/hooks/useFicha360ConversationSummary.ts` (~80 linhas)

```ts
export function useFicha360ConversationSummary(contactId?: string) {
  const generate = useMutation({
    mutationFn: async (params: GenerateParams) => {
      const { data, error } = await supabase.functions.invoke('ficha360-conversation-summary', { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as ConversationSummaryResult;
    },
    onSuccess: () => toast.success('Resumo gerado!'),
    onError: (e) => toast.error(e.message),
  });

  const history = useQuery({
    queryKey: ['f360-summary-history', contactId],
    queryFn: async () => { /* últimos 5 do contato */ },
    enabled: !!contactId,
    staleTime: 60_000,
  });

  return { generate: generate.mutateAsync, generating: generate.isPending, history: history.data ?? [] };
}
```

### 4. Novo componente: `src/components/ficha-360/ResumoConversaIADialog.tsx` (~220 linhas)

Dialog modal disparado pelo botão. Estrutura:

- **Header**: "Resumo IA da conversa" + chip "X interações analisadas" + chip dos filtros ativos resumidos (`Últimos 30 dias · WhatsApp + Email · 2 tags`).
- **Estados**:
  - `idle`: card de preview com "Vou analisar X interações filtradas. Isso usa IA. Continuar?" + botões `[Cancelar] [Gerar resumo]`.
  - `loading`: skeleton com 6 blocos + texto "Analisando…" + ETA estimado.
  - `success`: render do `summary` em seções colapsáveis:
    - 👤 **Perfil resumido** (2-3 frases)
    - 💬 **Estilo de comunicação**
    - 📌 **Tópicos principais** (chips)
    - ✅ **Decisões & acordos** (lista)
    - ⏳ **Pendências** (lista com prazo opcional)
    - 🚦 **Sinais de relacionamento** (badges coloridos por tipo)
    - 🎯 **Próximos passos sugeridos** (lista com botão "Criar tarefa" por item)
    - 📊 **Risco de churn** + barra de confiança
  - `error`: mensagem + botão `Tentar novamente`.
- **Ações no rodapé**: `[Copiar markdown] [Baixar .md] [Fechar]`. "Copiar" usa `navigator.clipboard`; "Baixar" gera blob `.md` client-side.
- Empty guard: se `interaction_ids.length === 0`, dialog mostra "Não há interações para resumir com os filtros atuais" sem chamar IA.

### 5. Botão de disparo: `src/components/ficha-360/GerarResumoIAButton.tsx` (~60 linhas)

- Botão `variant="gradient"` com ícone `Sparkles` + label "Resumo IA" + badge `[N]` mostrando quantas interações serão analisadas.
- Disabled quando `filteredInteractions.length === 0`, com tooltip "Aplique filtros que retornem ao menos 1 interação".
- Atalho **Alt + I** (Inteligência) abre o dialog. Aparece no cheatsheet via `useFicha360FilterShortcuts`.
- Mostra `RefreshCw` discreto se já existe resumo recente (<24h) — com tooltip "Resumo em cache. Clique para ver".

### 6. `Ficha360.tsx` — integração

- Importar `GerarResumoIAButton` + `ResumoConversaIADialog`.
- Estado local `const [summaryOpen, setSummaryOpen] = useState(false)`.
- Renderizar o botão no `headerExtra` da seção "Últimas Interações", **antes** dos toggles de visualização/ordenação (posição de destaque).
- Passar `interactionIds = filteredInteractions.map(i => i.id)`, `contactSnapshot` (nome, cargo, empresa, DISC, hobbies/interesses do `profile`), `filtersSummary` (período, canais, tags, busca).
- Atalho `Alt + I` → `setSummaryOpen(true)` (no-op se 0 interações).

### 7. `useFicha360FilterShortcuts.ts` — atalho Alt+I

Adicionar no escopo `ficha360-filtros`:
- `Alt + I` → dispara evento `ficha360:open-ai-summary` (no-op se 0 interações; toast "Sem interações filtradas").

### 8. Histórico mínimo na Ficha 360 (opcional, dentro do dialog)

No header do dialog, dropdown `[🕘 Últimos resumos ▾]` lista os 5 mais recentes deste contato (do hook `history`). Click carrega o `summary` salvo sem nova chamada à IA. Cada item: `dd/MM HH:mm · X interações · X tags`.

## Não muda

- `meeting-summary` edge function e `useMeetingSummary` (continuam servindo resumo de 1 interação isolada).
- Filtros, ordenação, timeline, view modes, favoritos, contagens — escopo intacto.
- Schema das interações, RLS de `interactions`, `vw_interaction_timeline`.

## Critérios de aceite

(a) Botão "✨ Resumo IA [N]" aparece no header de "Últimas Interações" mostrando contagem das filtradas; (b) disabled quando N=0 com tooltip explicativo; (c) clique abre dialog com confirmação antes de chamar IA; (d) loading com skeleton, success com 8 seções estruturadas, error com retry; (e) cache 24h via `filters_hash` evita reprocessar mesmos filtros; (f) ações copiar/baixar markdown funcionam no estado success; (g) atalho **Alt + I** abre dialog (no-op se 0 interações) e aparece no cheatsheet; (h) histórico dropdown lista 5 últimos resumos do contato; (i) tratamento explícito de 402 (créditos) e 429 (rate limit) com toasts PT-BR; (j) sem nova dependência, sem `any`, PT-BR, novos arquivos: edge function <200 linhas, hook <100, dialog <250, botão <80; (k) acessibilidade: dialog com `aria-labelledby`, seções com `<h3>`, badges com `aria-label` descritivo.

