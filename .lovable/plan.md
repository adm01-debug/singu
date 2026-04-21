

# Plano: Validar ação "Limpar" dos filtros da Ficha 360

## Resultado da auditoria

A ação **já está implementada e consistente** em `src/hooks/useFicha360Filters.ts` e devidamente plugada na UI. Nenhuma mudança de código necessária.

## Evidências

**Hook `clear` (`useFicha360Filters.ts`, linhas 64-74):**
```ts
const clear = useCallback(() => {
  setSearchParams((prev) => {
    const sp = new URLSearchParams(prev);
    sp.delete('periodo');
    sp.delete('canais');
    return sp;
  }, { replace: true });
}, [setSearchParams]);
```

- Remove `periodo` e `canais` da URL preservando outros query params.
- Usa `replace: true` (não polui histórico).
- Após o clear, os memos `days` e `channels` recalculam: `days` cai para `DEFAULT_DAYS = 90` (fallback quando `periodo` é inválido/ausente) e `channels` vira `[]` (fallback quando `canais` é null).

**Plugado na UI:**
- `FiltrosInteracoesBar.tsx` (linhas 117-125): botão "Limpar" exibido quando `activeCount > 0`, dispara `onClear` → `clear()`.
- `FiltrosAtivosChips.tsx` (linhas 88-96): botão "Limpar tudo" exibido quando `activeChipCount >= 2`, dispara `onClearAll` → `clear()`.
- `Ficha360.tsx` passa `clear` como prop `onClear` / `onClearAll` para ambos os componentes.

**Comportamento end-to-end consistente:**
1. URL volta a `/ficha-360/<contactId>` (sem `?periodo` nem `?canais`).
2. Seletor de período destaca `90d` (default).
3. Todos os badges de canal voltam a `outline`.
4. Linha de chips ativos some (ou mostra apenas o contador).
5. `useFicha360({ days: 90, channels: [], … })` refaz a query sem filtros.

## Conclusão

A ação "Limpar" já remove `periodo` e `canais` da URL, restaura `days = 90` e `channels = []`, atualiza seletor + chips + lista de forma sincronizada e usa `replace: true`. Nenhuma alteração em código de produção é necessária — todos os critérios solicitados estão atendidos.

Se desejar reforço documental, posso adicionar uma seção "Comportamento esperado de Limpar" ao `docs/qa/ficha360-deep-link-filtros.md` consolidando os 5 pontos acima como referência única — mas o item já está coberto pelos cenários 3.5 e pelo checklist existentes.

