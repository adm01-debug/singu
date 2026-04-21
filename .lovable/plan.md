

# Status: já implementado — proposta de polimento opcional

## Diagnóstico

Tudo que foi pedido na tarefa **já existe** no código atual:

| Requisito | Onde |
|---|---|
| Clique nos buckets (Positivo/Neutro/Negativo/Misto) | `SentimentDistributionChart.tsx` — clique em fatia do `Pie` E em item da legenda, com a11y completa |
| Drawer de exemplos | `SentimentExamplesDrawer.tsx` (Sheet lateral) |
| Até 20 conversas | `MAX_EXAMPLES = 20`, com rodapé "Mostrando 20 de N" |
| Link para Ficha 360° | `<Link to={\`/contatos/${ex.contact_id}/ficha-360\`}>` |
| Aba Insights de `/interacoes` | `InsightsPanel.tsx` linha 138-142 |
| Buckets agregados | `useInteractionsInsights.sentimentBuckets` |

Fluxo end-to-end validado: clique → `setSelectedBucket(key)` → drawer abre → fetch via `supabase.from("interactions").in("id", limitedIds)` ordenado por `created_at desc` → renderiza cards com badge, conteúdo truncado, data/tipo e CTA "Ficha 360".

## Decisão

Como a feature já está entregue, **não há nada a implementar para cumprir o pedido**. Antes de gerar código redundante, abaixo listo melhorias opcionais que poderiam ser aplicadas se você quiser elevar a qualidade. **Nenhuma é necessária** para fechar o pedido — escolha quais (se alguma) quer que eu execute.

## Melhorias opcionais (escolher 0 a N)

1. **Migrar fetch para TanStack Query** — substituir o `useEffect` + `useState` no drawer por `useQuery(['sentiment-examples', bucket, limitedIds.join(',')], …)` com `staleTime: 5min`, conforme padrão do projeto (memória "TanStack Query Rules"). Reduz refetch ao reabrir o mesmo bucket no período da sessão.

2. **Realçar o bucket selecionado no chart** — ao abrir o drawer, aplicar `opacity` reduzida nas demais fatias e `stroke` no bucket ativo. Sinal visual de "estou vendo este recorte".

3. **Botão "Ver no contexto" por exemplo** — adicionar segundo CTA ao lado de "Ficha 360" que navega para `/interacoes?id={ex.id}` (ou abre modal de detalhe se existir), facilitando voltar ao contexto da conversa, não só ao contato.

4. **Skeleton do drawer alinhado ao layout do card** — substituir o `Loader2` central por 3 `<Skeleton>` no formato dos `<article>` reais (header + 3 linhas + footer). Reduz salto visual quando os dados chegam.

5. **Ordenação selecionável** — toggle "Mais recentes / Mais negativas / Maior duração" no header do drawer (usa `sentiment` e `created_at` já trazidos no select).

6. **Filtro por canal/tipo dentro do drawer** — chips no topo (`Email`, `WhatsApp`, `Call`…) que filtram client-side os 20 exemplos já carregados.

## Recomendação

Se quiser apenas **fechar o pedido**: nada a fazer, está pronto em produção.
Se quiser **um polimento de alto valor / baixo risco**: combine **#1 (TanStack Query)** + **#4 (skeleton alinhado)**. As duas juntas mantêm o escopo enxuto, seguem padrões do projeto e melhoram percepção de performance sem mudar UX.

Me diga quais melhorias aprovar (ex.: "faça 1 e 4", "faça todas", ou "nenhuma, está ok") e eu sigo.

