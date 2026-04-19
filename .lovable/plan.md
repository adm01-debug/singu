
Rodada A entregue (4 melhorias). Avanço para **Rodada B — Game Changers** (4 melhorias atômicas focadas em navegação, confiança em IA e colaboração).

# Rodada B — Game Changers

**1. Command Bar global ⌘K unificada** — nova `GlobalCommandBar` que substitui/estende o `GlobalSearch` atual. 4 modos com toggle no topo:
- **Navegar**: lista todas as 50+ rotas agrupadas por seção (CRM, Inteligência, Outbound, Comunicação, Admin) com ícones e atalhos
- **Buscar**: busca federada existente (contatos/empresas/interações)
- **Ações**: comandos rápidos ("Novo contato", "Nova interação", "Toggle densidade", "Trocar tema")
- **Perguntar**: modo IA (já existente)

Atalho: ⌘K (já registrado). Persistir últimas 5 ações em `localStorage` (`singu-cmdk-recent-v1`). Reusa primitiva `CommandPalette` do shadcn.

**2. Daily Briefing IA ao login** — card no topo do Dashboard `DailyBriefingCard` que aparece 1x/dia (key: `singu-briefing-{date}`) com:
- Resumo do que mudou desde ontem (deals movidos, interações, tarefas vencidas)
- Top 3 prioridades sugeridas com CTA direto
- Métricas do dia anterior vs média
- Botão "Dispensar por hoje" / "Ver detalhes"

Heurística client-side sobre dados já carregados (sem nova edge function).

**3. Saved Views compartilháveis** — hook `useSavedViews(scope)` + componente `SavedViewsBar` para Contatos, Empresas e Pipeline. Features:
- Salvar combinação atual de filtros + colunas + ordenação como "View" nomeada
- Persistir em `localStorage` (`singu-views-{scope}-v1`)
- Compartilhar via URL (encode em base64 no query param `?view=`)
- View padrão por usuário (auto-load)
- Lista de views recentes/favoritas

**4. WhyScoreDrawer integrado em todos scores** — auditoria e wire-up do `WhyScoreDrawer` (já criado na Rodada A) em:
- `LeadScoreBadge` (já tem ContatoDetalhe)
- `ForecastConfidenceBadge` no DealCard (Pipeline)
- `ChurnRiskBadge` em ContatoDetalhe e EmpresaDetalhe
- `SentimentBadge` quando aplicável

Cada um expõe seus fatores específicos via prop `factors: WhyScoreFactor[]`. Padronizar `scoreKey` como `<modulo>:<entidade>:<id>` para feedback loop unificado.

## Restrições
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes.

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) constraints respeitadas. Memória atualizada ao fim em `mem://features/ux-rodada-b-game-changers.md`.

Aprove e executo as 4 em sequência sem pausas.
