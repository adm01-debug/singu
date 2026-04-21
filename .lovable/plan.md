
# Plano: Próximos Passos Sugeridos na Ficha 360

## Objetivo

Adicionar um card **"Próximos Passos"** na Ficha 360 que gera de 3 a 5 sugestões acionáveis (ex.: *"Agendar reunião quinta 14h"*, *"Enviar WhatsApp pela manhã"*, *"Retomar por e-mail"*) com base em sinais já carregados pela tela: últimas interações, melhor canal/horário, sentimento, cadência e score de prontidão.

## Reutilização total (zero novo fetch)

| Sinal | Hook já em uso |
|---|---|
| Últimas interações | `useFicha360 → recentInteractions` |
| Melhor canal + horário | `useContactIntelligence → best_channel`, `best_time` |
| Cadência/recência/sentimento | `useContactView360 → profile` |
| Score de prontidão | `computeProntidaoScore` (já calculado no topo) |
| Próxima ação IA salva | `useNextBestAction` (já existe) |

Sem nova edge function, sem nova tabela, sem novo fetch. Todas as sugestões locais são geradas por função pura `useMemo`. A sugestão IA vem do hook existente `useNextBestAction`.

## Arquitetura

```text
Ficha 360
 └─ Coluna direita (acima de "Últimas Interações")
     └─ ProximosPassosCard  (NOVO)
         ├─ Sugestão IA (topo, destaque) — useNextBestAction
         │    "Gerar com IA" se ainda não há
         └─ Lista de 3–5 sugestões locais (regras determinísticas)
              ├─ Ícone canal + título + horário recomendado
              ├─ Justificativa curta (1 linha)
              └─ CTA: [Criar tarefa] [Copiar script]
```

## Implementação

### 1. Lib `src/lib/proximosPassos.ts` (≤200 linhas, função pura)

```ts
export interface ProximoPasso {
  id: string;                    // estável p/ key
  channel: 'whatsapp'|'email'|'call'|'meeting'|'linkedin';
  title: string;                 // "Enviar WhatsApp"
  detail: string;                // "Pela manhã (10h–12h), seu melhor horário"
  reason: string;                // "Sentimento positivo na última conversa"
  priority: 'alta'|'media'|'baixa';
  scriptHint?: string;           // texto curto opcional p/ copiar
}

computeProximosPassos({
  profile, intelligence, recentInteractions, prontidao
}): ProximoPasso[]   // máx 5, ordenadas por prioridade
```

**Regras determinísticas (resumo):**

- **Reabrir conversa** se `daysSinceLast > cadence_days × 1.5` → prioridade alta, canal = `intelligence.best_channel ?? lastChannel`
- **Agendar reunião** se `prontidao.level ∈ {quente,pronto}` E sem `meeting` nos últimos 30d → alta
- **WhatsApp follow-up** se última interação é WhatsApp sem resposta inbound → média
- **Retomar por e-mail** se sem interações em 14d e contato tem email → média
- **Enviar conteúdo/parabéns** se aniversário em ≤7d → alta
- **Pedir feedback** se última for `meeting` há 1–7d e sem retorno → média
- **Detalhe de horário**: usa `intelligence.best_time` (ex.: "manhã", "14h-16h")

Todas as regras com `Array.isArray()` defensivo e fallback gracioso.

### 2. Componente `ProximosPassosCard.tsx` (≤200 linhas)

`src/components/ficha-360/ProximosPassosCard.tsx`

- Header: ícone `ListChecks` + título "Próximos Passos" + badge contador
- **Bloco 1 — Sugestão IA** (se `nextAction` existe):
  - Mini-card com ícone `Sparkles`, ação, urgência e botão "Ver detalhes" (abre o `NextBestActionCard` existente — opcional via scroll)
  - Se não existe: botão "Gerar com IA" (chama `generate()` do `useNextBestAction`)
- **Bloco 2 — Sugestões locais** (lista compacta):
  - Cada item: ícone canal + título + horário/dia + razão (1 linha)
  - Ações por item: `[Criar tarefa]` (usa `useCreateTask`), `[Copiar script]` (se `scriptHint`)
  - Badge de prioridade (cor semântica)
- Empty state: "Sem ações sugeridas no momento. Registre uma interação para gerar novas recomendações."
- `React.memo`, flat design, tokens semânticos, PT-BR

### 3. Integração em `Ficha360.tsx`

- Importar `computeProximosPassos` e `ProximosPassosCard`
- `const passos = useMemo(() => computeProximosPassos({...}), [profile, intelligence, recentInteractions, prontidao])`
- Renderizar `<ProximosPassosCard contactId={id} contactName={...} passos={passos} />` na **coluna direita**, logo **acima** do card de últimas interações (vizinhança natural)

### 4. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` antes de iterar interações
- Tokens semânticos (success/warning/destructive)
- Flat design, sem sombras/gradientes
- Função pura testável, sem efeitos colaterais

## Arquivos tocados

**Novos (2):**
- `src/lib/proximosPassos.ts` — regras determinísticas
- `src/components/ficha-360/ProximosPassosCard.tsx` — UI

**Editados (1):**
- `src/pages/Ficha360.tsx` — incluir card na coluna direita

## Critério de fechamento

(a) Card "Próximos Passos" visível na coluna direita acima das últimas interações, (b) bloco IA reutilizando `useNextBestAction` (com botão "Gerar" quando vazio), (c) lista de 3–5 sugestões locais determinísticas com canal, horário recomendado, razão e prioridade, (d) ações "Criar tarefa" e "Copiar script" funcionais, (e) empty state quando não há sinais, (f) zero novas queries de rede, (g) zero regressão nos demais cards.
