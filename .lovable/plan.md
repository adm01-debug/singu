
Continuando a sequência. #5 entregue. Os 7 itens da lista #10 já têm cobertura: auto-enrichment (Lux/EnrichLayer), company intel (Lux), buying signals (Intent Data), people intel (trigger), visitor ID (Intent pixel), email finder/verifier e phone validation (suíte nova). Próximo gap real de UX: export.

## Melhoria #6: Export CSV de contatos enriquecidos

### Escopo
Botão "Exportar CSV" no header de `/enrichment` que gera CSV com colunas de qualidade de dados, permitindo o usuário baixar a lista para auditoria/limpeza externa.

### Colunas
`id, first_name, last_name, email, email_status, email_score, email_verified_at, phone, phone_status, phone_e164, phone_line_type, phone_country, has_intel_event, last_intel_event_at, role_title, company_name, created_at`

### Filtros (popover antes do download)
- Apenas com email validado / inválido / qualquer
- Apenas com telefone validado / inválido / qualquer
- Apenas com sinais de People Intel
- Limite (1000/5000/10000)

### Implementação
- Novo hook `useEnrichmentExport.ts` — busca contatos do user via Supabase + LATERAL join client-side com últimas verificações (5 queries paralelas, agrega em memória)
- Novo `EnrichmentExportButton.tsx` — Popover com filtros + botão "Baixar CSV" → gera Blob via `Papa.unparse` e dispara download
- Editar `Enrichment.tsx` — botão no header ao lado do `<h1>`
- Reutilizar `papaparse` se já existir, senão usar implementação CSV inline simples (escape + join)

### Validação
- Build limpo
- Click → popover → "Baixar" → arquivo `enriquecimento-YYYY-MM-DD.csv` baixado
- Abrir no Excel: colunas corretas, sem quebra de encoding (UTF-8 BOM)

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR.

Após #6 → #7 (notificação automática quando People Intel detecta mudança de cargo de contato chave).
