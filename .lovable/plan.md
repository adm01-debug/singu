

# Plano: Botão "Zerar período" na barra de filtros da Ficha 360

## Objetivo

Adicionar um botão na `FiltrosInteracoesBar` que volte o período ao padrão (90 dias) **sem tocar nos canais selecionados**, complementando os botões já existentes ("Todos os canais" e "Limpar").

## Mudanças

### 1. `src/components/ficha-360/FiltrosInteracoesBar.tsx`

Adicionar novo botão entre o seletor de período e a seção de canais (ou logo após "Todos os canais"), visível apenas quando `days !== 90`:

```tsx
{days !== 90 && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onDaysChange(90)}
    className="h-6 px-2 text-xs text-muted-foreground gap-1"
    aria-label="Zerar período para 90 dias"
    title="Voltar para o período padrão (90 dias)"
  >
    <RotateCcw className="h-3 w-3" /> Zerar período
  </Button>
)}
```

- Importar `RotateCcw` de `lucide-react`.
- Reutiliza o handler `onDaysChange` já presente nas props (não exige nova prop nem mudança de assinatura).
- Como chama `onDaysChange(90)` via hook `setDays`, o `useFicha360Filters` remove `?periodo` da URL (já que `90` é o `DEFAULT_DAYS`) usando `replace: true` — comportamento já implementado.
- Canais permanecem intactos (a chamada não toca em `setChannels`).

### 2. Posicionamento visual

Colocar o botão "Zerar período" **imediatamente após o grupo de período** (antes dos badges de canais), para proximidade semântica. Os botões "Todos os canais" e "Limpar" continuam ao final.

Ordem final da barra:
1. Grupo de período (7d/30d/90d/1a)
2. **[NOVO]** "Zerar período" (condicional: `days !== 90`)
3. Badges de canais
4. "Todos os canais" (condicional: há canais ativos)
5. "Limpar" (condicional: `activeCount > 0`)

## Critérios de aceite

(a) Botão "Zerar período" aparece em `FiltrosInteracoesBar` somente quando `days !== 90`; (b) clicar dispara `onDaysChange(90)`, removendo `?periodo` da URL via `replace: true` (comportamento já no hook); (c) canais selecionados (`?canais=...`) permanecem inalterados após o clique; (d) ícone `RotateCcw` + label "Zerar período" em PT-BR; (e) `aria-label` e `title` descritivos; (f) estilo consistente com os demais botões ghost da barra (`h-6 px-2 text-xs text-muted-foreground gap-1`); (g) sem nova prop, sem mudança no hook, sem mudança em `Ficha360.tsx` ou `FiltrosAtivosChips.tsx`; (h) flat, sem emojis, arquivo permanece pequeno.

