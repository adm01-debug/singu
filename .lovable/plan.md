

# Plano: Botão "Limpar canais" no `CanaisQuickFilter`

## Contexto

Hoje, para zerar só os canais sem mexer em busca/contato/empresa/datas/direção/sort, o usuário precisa desclicar chip por chip (ou usar o "Limpar tudo" da `ActiveFiltersBar`, que apaga todo o resto). Falta um atalho local: **resetar apenas a dimensão "canais"**, preservando todos os outros filtros.

## Decisão de escopo

- Botão **"Limpar canais"** dentro do `CanaisQuickFilter`, ao lado do toggle de modo (Zap/MousePointerClick).
- Aparece **somente quando há canais selecionados** (`pending.length > 0` no modo manual, ou `safe.length > 0` no modo auto). Caso contrário fica oculto pra não poluir.
- Comportamento por modo:
  - **Auto**: chama `onChange([])` direto. Toast "Filtros de canal limpos".
  - **Manual**: zera só `pending` (`setPending([])`), **não** chama `onChange`. O usuário precisa clicar em "Aplicar" pra efetivar — mantém o contrato do modo manual. Se já houver canais aplicados, o botão "Aplicar (+N)" passa a refletir a diferença normalmente.
- Visual: `Button variant="ghost" size="xs"` com ícone `Eraser` (já em lucide-react) + texto "Limpar canais". Tooltip explica o comportamento por modo.
- A11y: `aria-label="Limpar seleção de canais"`.
- Não toca em nada externo (busca, datas, contato, empresa, direção, sort, presets) — `setFilter('canais', [])` afeta só essa chave do `useInteractionsAdvancedFilter`.

## Implementação

### `src/components/interactions/CanaisQuickFilter.tsx`

1. Importar `Eraser` de `lucide-react` (junto com os outros ícones já importados na linha 2).
2. Adicionar callback:
   ```ts
   const clearAll = useCallback(() => {
     if (mode === 'auto') {
       if (safe.length === 0) return;
       onChange([]);
       toast.success('Filtros de canal limpos');
     } else {
       if (pending.length === 0) return;
       setPending([]);
       toast.info('Canais desmarcados', {
         description: 'Clique em "Aplicar" para confirmar.',
         duration: 3000,
       });
     }
   }, [mode, safe, pending, onChange, setPending]);
   ```
3. Renderizar o botão entre o toggle de modo (linhas 199-217) e o bloco `dirty` (linha 219), condicionado a `(mode === 'auto' ? safe.length > 0 : pending.length > 0)`. Envolver em `Tooltip` com texto explicativo por modo.

### `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx`

Adicionar 3 testes:
1. **Auto**: com `canais=['email','whatsapp']`, clicar em "Limpar canais" chama `onChange([])`.
2. **Manual**: com pending `['email']`, clicar em "Limpar canais" NÃO chama `onChange`; chips ficam desmarcados; botão "Aplicar" continua visível pra confirmar.
3. **Visibilidade**: sem canais selecionados, o botão "Limpar canais" não aparece.

## Padrões obrigatórios

- PT-BR, tokens semânticos, flat (sem sombras/gradientes).
- Zero novas deps.
- Backward compat: nenhum efeito quando não há canais selecionados.
- Mantém o contrato de cada modo (auto = imediato; manual = exige Aplicar).

## Arquivos tocados

**Editados (2):**
- `src/components/interactions/CanaisQuickFilter.tsx` — botão "Limpar canais" + handler.
- `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx` — 3 testes novos.

## Critério de fechamento

(a) Botão "Limpar canais" visível ao lado do toggle de modo somente quando há canais selecionados; (b) modo auto: clique chama `onChange([])` e mostra toast; (c) modo manual: clique zera só `pending` sem chamar `onChange`, exigindo "Aplicar" depois; (d) nenhum outro filtro (busca, datas, contato, empresa, direção, sort) é afetado; (e) testes cobrem ambos modos + visibilidade condicional; (f) PT-BR, tokens semânticos, flat, zero novas deps.

