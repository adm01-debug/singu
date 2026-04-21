

# Plano: Teste manual de sincronização URL → UI da Ficha 360

## Diagnóstico

O hook `useFicha360Filters()` já está integrado à seção "Últimas Interações" da Ficha 360 e lê `?periodo=` e `?canais=` da URL como fonte de verdade. Falta um **roteiro de teste manual** reproduzível para validar visualmente que abrir um deep link restaura o estado dos seletores e chips.

## Entregável

Novo arquivo `docs/qa/ficha360-deep-link-filtros.md` em PT-BR, em formato passo a passo com critérios objetivos de aprovação. Sem mudanças em código de produção.

## Estrutura do documento

### 1. Pré-requisitos
- Usuário autenticado na preview.
- Existir ao menos 1 contato acessível.
- Substituir `<contactId>` pelo UUID de um contato real (ex.: copiar de `/contatos`).

### 2. Roteiro principal (caminho feliz)

Passo 1 — Acessar o deep link:
```
/ficha-360/<contactId>?periodo=7&canais=whatsapp,email
```

Passo 2 — Validar **seletor de período** (`FiltrosInteracoesBar`):
- Botão `7d` aparece ativo (`bg-primary text-primary-foreground`, `aria-pressed="true"`).
- Botões `30d`, `90d`, `1a` aparecem inativos.

Passo 3 — Validar **seletor de canais**:
- Badges `WhatsApp` e `Email` aparecem em variant `default` (ativos, `aria-pressed="true"`).
- Badges `Ligação`, `Reunião`, `Nota` em variant `outline` (inativos).
- Botão "Todos os canais" visível (porque há canais ativos).

Passo 4 — Validar **chips de filtros ativos** (`FiltrosAtivosChips`):
- Chip `Período: 7d` com ícone calendário e botão de fechar.
- Chip `WhatsApp` com ícone de mensagem e botão de fechar.
- Chip `Email` com ícone de envelope e botão de fechar.
- Botão `Limpar tudo` visível (≥ 2 chips ativos).
- Contador `X de Y interaç(ões)` reflete a contagem filtrada.

Passo 5 — Validar **lista** (`UltimasInteracoesCard`):
- Apenas interações dos últimos 7 dias com canal `whatsapp` ou `email`.
- Caso vazio: empty state contextual "Nenhuma interação nos filtros" + "Ajuste o período ou os canais selecionados acima."

### 3. Cenários complementares

**3.1 Recarregar a página (F5)** — todos os 4 pontos acima permanecem idênticos (URL é fonte de verdade, sem perda de estado).

**3.2 Voltar/avançar do navegador** — após mudar para `?periodo=30`, usar back: chips e seletores voltam a `7d + whatsapp,email`.

**3.3 Compartilhar o link** — copiar URL da barra, colar em aba anônima logada: estado idêntico.

**3.4 Remover chip pela UI** — clicar no `X` do chip `Email`: URL passa a `?periodo=7&canais=whatsapp`, badge Email fica `outline`, lista re-filtra.

**3.5 Clicar "Limpar tudo"** — URL perde `periodo` e `canais`, seletor volta para `90d`, todos os badges de canal ficam `outline`, chips somem.

### 4. Casos de borda

- `?periodo=999` (inválido) → fallback para `90d` (default), nenhum chip de período.
- `?canais=` (vazio) ou `?canais=,,,` → tratado como sem canais ativos.
- `?canais=WHATSAPP,Email` (case misto) → normalizado para lowercase, badges corretos ativos.
- `?canais=invalido` → badge não existe na barra, mas chip exibe label cru com ícone genérico de FileText (comportamento atual de `FiltrosAtivosChips`).

### 5. Critérios de aprovação (checklist)

Lista marcável de 10 itens objetivos (estado do seletor de período, estado dos badges de canal, presença/ausência de cada chip esperado, contador, lista filtrada, persistência em F5, navegação back/forward, deep link em aba anônima, remoção via chip, "Limpar tudo").

### 6. Como reportar falha

Template curto: URL exata, screenshot da barra+chips+lista, valor esperado vs observado, console errors (se houver).

## Sem alterações em

- `useFicha360Filters.ts`, `FiltrosInteracoesBar.tsx`, `FiltrosAtivosChips.tsx`, `UltimasInteracoesCard.tsx`, `Ficha360.tsx` ou qualquer código de produção.
- Suíte E2E (`e2e/smoke.spec.ts`) — este é teste **manual** complementar, não automatizado.

## Critérios de aceite

(a) Existe `docs/qa/ficha360-deep-link-filtros.md` em PT-BR; (b) contém pré-requisitos, roteiro principal de 5 passos com expectativas visuais objetivas para seletor de período, badges de canal, chips ativos e lista; (c) inclui ≥4 cenários complementares (reload, back/forward, link compartilhado, remoção via chip, limpar tudo); (d) inclui casos de borda para período inválido, canais vazios, case misto e canal desconhecido; (e) checklist final com ≥10 itens marcáveis; (f) template de report de falha; (g) sem mudanças em código de produção; (h) flat, sem emojis.

