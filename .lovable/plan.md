

# Melhorias Criativas na Visualização de Empresas

## Contexto

O banco externo possui **57.728 empresas** com dados riquíssimos que hoje são **ignorados** na listagem: `capital_social`, `grupo_economico`, `nicho_cliente`, `ramo_atividade`, `website`, `logo_url`, `situacao_rf`, `cnpj`, `employee_count`, `is_carrier`, `is_supplier`, além das tabelas relacionais (`company_rfm_scores`, `company_stakeholder_map`, `company_cnaes`). A interface atual mostra apenas nome, badge Cliente/Prospect, contatos e data — subutilizando o potencial dos dados.

---

## Melhoria 1: "Company Intelligence Strip" nos Cards

Adicionar uma faixa visual compacta no card com **micro-indicadores** extraídos dos dados reais:

- **Capital Social** formatado (ex: `R$ 460M`) com ícone de moeda
- **Grupo Econômico** como chip discreto (ex: "Volvo - Revenda")
- **Nicho** como tag contextual (ex: "Indústria Automobilística")
- **Website** como ícone clicável (abre em nova aba)
- **Logo real** quando `logo_url` existe (já parcialmente implementado mas pouco usado)
- **Situação RF** como dot indicator (verde = ATIVA, vermelho = INATIVA)

## Melhoria 2: "Pipeline Funnel" Visual na StatsBar

Substituir a barra de stats genérica por um **mini-funil visual** que mostra a distribuição real:

```text
┌─────────────────────────────────────────────┐
│  57.728 Total  →  Clientes: 12K  │  Prospects: 45K  │  Sem Contato +30d: 890  │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░  (21% conversão)                    │
└─────────────────────────────────────────────┘
```

- Barra de progresso visual mostrando proporção Cliente vs Prospect
- Taxa de conversão calculada automaticamente
- Sparkline opcional de novas empresas nos últimos 30d

## Melhoria 3: "Grupo Econômico" Clustering Visual

Na view de **Grade**, agrupar visualmente empresas do mesmo `grupo_economico`:

- Header discreto antes de cada cluster: "Grupo: Volvo - Revenda (3 empresas)"
- Linha lateral colorida conectando cards do mesmo grupo
- Opção de colapsar/expandir grupos
- Filtro rápido por grupo econômico no AdvancedFilters

## Melhoria 4: "Heatmap de Atividade" na Tabela

Na view de **Tabela**, adicionar uma coluna visual "Pulso" com um **mini heatmap horizontal** (últimas 4 semanas):

- Cada célula = 1 semana, cor = intensidade de interações
- Permite identificar padrão de engajamento de relance
- Tooltip mostra "3 interações na semana de 01/04"

## Melhoria 5: "Smart Segments" — Filtros Dinâmicos do BD Externo

Os filtros atuais têm opções hardcoded (Tecnologia, Saúde, etc.) que **não refletem os dados reais** (o BD tem "Concessionárias de Caminhões", "Indústria Automobilística", etc.). Melhorias:

- Usar o endpoint `distinct` para buscar valores reais de `ramo_atividade`, `grupo_economico`, `nicho_cliente`, `situacao_rf` e popular os filtros dinamicamente
- Adicionar filtro por `is_carrier` (Transportadora) e `is_supplier` (Fornecedor)
- Filtro por faixa de `capital_social` (slider)

## Melhoria 6: "Company Scorecard" — Tooltip Rico no Hover

Ao passar o mouse sobre um card/linha, exibir um **tooltip expandido** (tipo preview card) com:

- CNPJ formatado
- Razão Social completa
- Capital Social
- Situação RF + data
- Número de stakeholders (do `company_stakeholder_map`)
- Score RFM (do `company_rfm_scores`)
- Últimas 2 interações

## Melhoria 7: "Mapa Inline" na View de Lista

Adicionar um **mini-mapa** discreto no canto superior direito da listagem que mostra pins das empresas visíveis na tela atual — sem substituir a página de Mapa, mas como contexto geográfico rápido. Ao clicar num pin, scrolla até a empresa correspondente.

---

## Plano de Implementação (Priorizado)

| # | Melhoria | Impacto | Esforço |
|---|----------|---------|---------|
| 1 | Smart Segments (filtros dinâmicos) | Alto | Médio |
| 2 | Company Intelligence Strip | Alto | Médio |
| 3 | Pipeline Funnel na StatsBar | Alto | Baixo |
| 4 | Company Scorecard (hover) | Médio | Médio |
| 5 | Grupo Econômico Clustering | Médio | Alto |
| 6 | Heatmap de Atividade | Médio | Alto |
| 7 | Mapa Inline | Baixo | Alto |

### Arquivos Impactados

- `src/components/companies/CompaniesStatsBar.tsx` — Pipeline Funnel
- `src/components/company-card/CompanyCardWithContext.tsx` — Intelligence Strip + Scorecard
- `src/components/companies/CompaniesTableView.tsx` — Heatmap + dados enriquecidos
- `src/components/companies/CompanyListItem.tsx` — dados enriquecidos
- `src/pages/Empresas.tsx` — filtros dinâmicos + clustering
- `src/hooks/useCompanies.ts` — mapear campos adicionais (`capital_social`, `grupo_economico`, `nicho_cliente`, `website`, `situacao_rf`, `cnpj`)
- `src/hooks/useExternalLookup.ts` — já existe, será usado para popular filtros

Posso implementar todas as 7 melhorias sequencialmente, começando pelas de maior impacto/menor esforço. Qual priorização você prefere, ou devo executar todas na ordem sugerida?

