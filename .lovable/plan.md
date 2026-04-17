
Build error: `BulkRevalidateCard.tsx` importa `@/components/ui/toggle-group` que não existe no projeto.

## Correção rápida + continuação

### Fix do build
Substituir `ToggleGroup`/`ToggleGroupItem` por 3 botões shadcn `Button` com variant baseada em `kind === value` no `BulkRevalidateCard.tsx`. Mantém UX (3 opções: Emails / Telefones / Ambos) sem nova dependência.

### Após fix, seguir para Melhoria #5: Dashboard de cobertura de enriquecimento
Card "Cobertura de enriquecimento" no topo do `/enrichment` substituindo o stat "Cobertura 7/7" estático por métricas reais:
- % contatos com email validado (status=valid)
- % contatos com telefone validado (status=valid)  
- % contatos com pelo menos 1 evento People Intel
- % contatos enriquecidos via Lux/EnrichLayer (campo `enriched_at` se existir, senão skip)

Implementação:
- Novo hook `useEnrichmentCoverage()` — TanStack Query, agrega via `count` queries em paralelo (`contacts`, `email_verifications`, `phone_validations`, `people_intelligence_events`)
- Novo `EnrichmentCoverageCard.tsx` com 4 progress bars (shadcn `Progress`) + tooltip explicando cálculo
- Editar `Enrichment.tsx`: remover stat estático "7/7", inserir card de cobertura no lugar

### Validação
- Build limpo
- Card renderiza com percentuais reais
- Refetch a cada 60s

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR.

Após #5 → #6 (export CSV de contatos enriquecidos com colunas de status validação).
