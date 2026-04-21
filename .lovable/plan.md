

# Plano: Explicação da pontuação de "Melhor correspondência"

## Contexto

O chip `Melhor correspondência` em `SortChips` já tem tooltip simples (`"Melhor correspondência · Alt+M"` quando habilitado, `"Disponível ao buscar por palavra-chave"` quando não). O usuário quer uma **explicação curta da fórmula de relevância** próxima ao chip — como o score é calculado a partir do termo buscado (título×3, tags×2, conteúdo×1, conforme `relevanceScore` em `src/lib/sortInteractions.ts` e `src/lib/groupInteractions.ts`).

## Decisão de escopo

- Adicionar um **ícone "info"** (`Info` do lucide) discreto **dentro** do chip "Melhor correspondência", à direita do label, visível apenas quando o chip está **habilitado** (há query). Mantém o chip clicável normalmente; o ícone tem seu próprio tooltip mais detalhado.
- O ícone NÃO é um botão separado (evita conflito de eventos com o chip): é um `<span>` decorativo com `aria-hidden`, e a explicação fica num `<Tooltip>` independente que envolve só o ícone, com `delayDuration` curto.
- **Conteúdo da tooltip** (PT-BR, 2 linhas): 
  > "Pontuação por ocorrências do termo: título conta 3×, tags 2×, conteúdo 1×. Empate desempata pela mais recente."
- Quando o chip está **desabilitado** (sem query), o ícone NÃO aparece — a tooltip do chip já explica "Disponível ao buscar por palavra-chave".
- Em mobile (`<sm`, label oculto), o ícone também aparece à direita do ícone principal (`Sparkles`) para não esconder a explicação.
- Acessibilidade: o `<button>` do chip mantém `aria-label="Melhor correspondência"`; o ícone info ganha `aria-hidden="true"` e a explicação fica acessível via tooltip (que já usa `role=tooltip` do Radix). Não duplica conteúdo no leitor de tela.

## Implementação

### Único arquivo: `src/components/interactions/SortChips.tsx`

1. Importar `Info` de `lucide-react`.
2. Dentro do `.map(...)`, quando `key === 'relevance' && !disabled`, renderizar um `<Tooltip>` extra envolvendo um `<span><Info /></span>` posicionado dentro do `<button>`, **depois** do label.
3. Estilo do ícone: `w-3 h-3 text-muted-foreground/70 ml-0.5` (discreto, semântico, flat).
4. Para evitar que o clique no ícone propague para o chip e o ative duas vezes, usar `onClick={(e) => e.stopPropagation()}` no `<span>` (clique no ícone não desativa o ordenação — só abre o tooltip no hover/focus, padrão Radix).
5. Tooltip side="bottom" com texto:  
   `Pontuação por ocorrências do termo: título conta 3×, tags 2×, conteúdo 1×. Empate desempata pela mais recente.`
6. Garantir que o badge `Alt+M` (que aparece com `altDown`) continue posicionado corretamente — o ícone info fica antes do badge sobreposto, sem interferência.

### Sem mudanças em:
- `sortInteractions.ts` / `groupInteractions.ts` — fórmula já implementada e correta.
- `useKeyboardShortcutsEnhanced.ts` — atalho não muda.
- Outros consumidores de `SortChips`.

## Testes

Editar `src/components/interactions/__tests__/SortChips.test.tsx`:

1. **Quando `hasQuery=true`**: existe um elemento com `data-testid="relevance-info-icon"` (ou usar `getByLabelText` numa abordagem mais semântica via `role="img"` no span — vou usar `data-testid` por simplicidade) **dentro** do botão "Melhor correspondência".
2. **Quando `hasQuery=false`**: o ícone info NÃO aparece (chip desabilitado).
3. Click no chip "Melhor correspondência" continua chamando `onChange('relevance')` mesmo com o ícone info presente (não quebra o handler).

## Padrões obrigatórios

- PT-BR, tokens semânticos HSL (`text-muted-foreground`), flat (sem shadows), zero novas deps (`Info` já existe em `lucide-react`).
- Backward compat: nenhuma prop nova; comportamento atual preservado quando `hasQuery=false`.
- A11y: ícone `aria-hidden`, tooltip Radix com `role=tooltip`, sem botão aninhado dentro de botão.

## Arquivos tocados

**Editados (2):**
- `src/components/interactions/SortChips.tsx` — adiciona ícone Info + tooltip com fórmula no chip "Melhor correspondência" quando habilitado.
- `src/components/interactions/__tests__/SortChips.test.tsx` — 3 novos testes cobrindo presença/ausência do ícone e integridade do click.

## Critério de fechamento

(a) O chip "Melhor correspondência" mostra um ícone info discreto à direita do label quando habilitado (com query); (b) hover/foco no ícone abre tooltip com a fórmula `título×3, tags×2, conteúdo×1` em PT-BR; (c) sem query, o ícone não aparece e o chip continua desabilitado com a tooltip atual; (d) clicar no chip ativa a ordenação normalmente, ícone não bloqueia; (e) atalho `Alt+M` e badge sobreposto continuam funcionando; (f) testes cobrem render condicional do ícone e integridade do click; (g) PT-BR, flat, zero novas deps.

