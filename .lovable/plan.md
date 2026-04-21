

# Plano: Link "Ver conversas" no spotlight de objeções

## Diagnóstico

- `ObjectionAggregate` já carrega `examples: string[]` (até 5 `interaction_id`s) por objeção em `useInteractionsInsights`.
- Existe padrão pronto `SentimentExamplesDrawer` (Sheet + TanStack Query buscando `interactions` por `id IN (...)` com skeleton e link para Ficha 360) — vou reaproveitar a mesma estrutura para objeções.
- Cada `ObjectionCard` no spotlight já tem footer com botões "Ver resposta completa" / "Copiar resposta". Adicionarei o link "Ver conversas" no mesmo footer.

## O que será construído

1. Novo componente `ObjectionExamplesDrawer` (espelho do `SentimentExamplesDrawer`, em `src/components/interactions/insights/`) que abre um Sheet lateral exibindo os exemplos de interações (`title`, trecho de `content`, `type`, `created_at`, badge `sentiment`) onde a objeção foi mencionada, com link "Ficha 360" por contato.
2. Botão **"Ver conversas"** dentro de cada `ObjectionCard` (ao lado de "Copiar resposta"), só renderizado quando `examples.length > 0`. Estado de drawer aberto controlado no card via `useState<boolean>`.

## Mudanças

### 1. Novo arquivo: `src/components/interactions/insights/ObjectionExamplesDrawer.tsx`
- Props: `{ objection: ObjectionAggregate | null; onClose: () => void }`.
- `Sheet` com `open={!!objection}`; título "Conversas mencionando esta objeção" + descrição com nome da objeção e contagem total/tratadas.
- `useQuery` (cache 5min) buscando `interactions` por `id IN examples` (limitado a 20), order `created_at desc`. Mostrar `title`, `content` (line-clamp-3), `type · data`, badge de `sentiment` e link "Ficha 360" para o `contact_id`.
- Estados: skeleton durante load, vazio quando sem exemplos. Sem `any`. ≤200 linhas.

### 2. `src/components/interactions/insights/ObjectionsSpotlight.tsx`
- Importar `ExternalLink` de `lucide-react` e `ObjectionExamplesDrawer`.
- Em `ObjectionCard`: adicionar `useState<boolean>` para `drawerOpen`.
- No bloco footer (onde estão "Ver resposta completa" e "Copiar resposta"), adicionar terceiro botão **"Ver conversas"** com ícone `ExternalLink h-3 w-3`, mesmo estilo `text-[11px] font-medium`, só renderizado quando `o.examples.length > 0`. Mostra contagem entre parênteses: `Ver conversas (N)`.
- Quando `o.unhandled === 0` (bloco de sucesso verde), incluir o mesmo botão "Ver conversas" ao lado da mensagem positiva, para manter o acesso aos exemplos mesmo em objeções bem tratadas.
- Renderizar `<ObjectionExamplesDrawer objection={drawerOpen ? o : null} onClose={() => setDrawerOpen(false)} />` ao final do card.

### 3. Sem mudanças em hooks, tipos ou agregação
- `ObjectionAggregate.examples` já existe e é populado.

## Critérios de aceite

(a) Cada card de objeção no spotlight com `examples.length > 0` exibe link "Ver conversas (N)" no footer; (b) clicar abre `Sheet` lateral com até 20 interações relacionadas (título, trecho, tipo, data, sentiment), ordenadas desc por `created_at`; (c) cada item tem link "Ficha 360" funcional para o contato; (d) drawer fecha via overlay/X e reseta estado local do card; (e) cards com `unhandled === 0` também mostram o link "Ver conversas" (não só os críticos); (f) skeleton durante load, mensagem amigável quando vazio; (g) cache TanStack 5min por id-set para evitar refetch ao reabrir; (h) PT-BR, flat, sem novas dependências; (i) `ObjectionsSpotlight.tsx` permanece ≤300 linhas; novo arquivo ≤200 linhas; (j) sem `any`; (k) sem regressão em "Ver resposta completa", "Copiar resposta", ordenação, badges ou barra de severidade.

