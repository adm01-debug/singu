

# Plano: Atalhos de teclado para alternar chips de canal

## Contexto

O usuário quer alternar canais (WhatsApp, Ligação, Email, Reunião, Vídeo, Nota) sem sair do campo de busca. `Ctrl+K` já está reservado globalmente para abrir o GlobalSearch (`useGlobalSearch.ts`), então **não posso reusar essa combinação**. Vou propor um esquema próximo, descobrível e que funciona inclusive com o foco dentro de inputs.

## Decisão de escopo

- Atalhos: **`Alt+1`…`Alt+6`** alternam o chip correspondente (1=WhatsApp, 2=Ligação, 3=Email, 4=Reunião, 5=Vídeo, 6=Nota). **`Alt+0`** limpa todos os canais.
- Funciona **mesmo com foco em `<input>`/`<textarea>`** (diferente do `useScopedShortcut` atual, que ignora inputs). Isso é o ponto-chave do pedido: alternar sem tirar o foco da busca.
- `Alt` foi escolhido porque:
  - Não conflita com `Ctrl+K` (GlobalSearch), `Ctrl+B` (sidebar), `?` (cheatsheet), `j/k/Enter/x` (list nav).
  - Em inputs, `Alt+número` não produz caracteres em layouts pt-BR/EN comuns (vs. `Shift+número` que digita `!@#$%¨&`).
- Comportamento por modo:
  - **Auto**: alterna direto via `onChange`.
  - **Manual**: alterna `pending` (igual ao clique no chip), respeitando o contrato de "Aplicar".
- Tooltip de cada chip ganha sufixo `(Alt+N)`. Cheatsheet (`?`) lista os 7 atalhos novos sob a categoria "Filtros de canal".
- Toast leve (`toast.message`) ao alternar via teclado, com nome do canal e estado novo (ex.: "WhatsApp ativado"), `duration: 1500`. Evita confusão de "apertei algo e não sei o que aconteceu".
- Badge visual `Alt+N` aparece no canto inferior do chip apenas quando o usuário pressiona `Alt` (escuta `keydown`/`keyup` em `Alt`), pra não poluir o layout normal.

## Implementação

### 1. `src/components/interactions/CanaisQuickFilter.tsx`

- Adicionar `useEffect` que registra listener global `keydown`:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === '0') { e.preventDefault(); clearAll(); return; }
      const idx = parseInt(e.key, 10);
      if (Number.isNaN(idx) || idx < 1 || idx > CANAL_CONFIG.length) return;
      e.preventDefault();
      const canal = CANAL_CONFIG[idx - 1];
      toggle(canal.id);
      const isActive = (mode === 'auto' ? safe : pending).includes(canal.id);
      // estado pós-toggle é o oposto
      toast.message(`${canal.label} ${!isActive ? 'ativado' : 'desativado'}`, { duration: 1500 });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, safe, pending, toggle, clearAll]);
  ```
- Adicionar `useState<boolean>` `altPressed`, escutando `Alt` keydown/keyup/blur, para mostrar badge `Alt+N` sobreposto ao chip.
- Atualizar tooltip de cada chip: `${label} (Alt+${index + 1})`.
- Atualizar tooltip do botão "Limpar canais": adicionar `(Alt+0)`.

### 2. `src/components/keyboard/KeyboardShortcutsCheatsheet.tsx` (ou registry equivalente)

Localizar onde os atalhos são listados (provavelmente `useKeyboardShortcutsEnhanced.ts`) e adicionar categoria **"Filtros de canal"** com:
- `Alt+1` → WhatsApp
- `Alt+2` → Ligação
- `Alt+3` → Email
- `Alt+4` → Reunião
- `Alt+5` → Vídeo
- `Alt+6` → Nota
- `Alt+0` → Limpar canais

Se o registry está em `keyboardShortcutRegistry.ts`, registrar via `registerShortcut` no mount do `CanaisQuickFilter` (com cleanup) — assim a cheatsheet pega automaticamente.

### 3. Testes: `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx`

3 testes novos:
1. **Alt+1 alterna WhatsApp em modo auto**: dispatch `keydown` com `altKey: true, key: '1'` → `onChange` chamado com `['whatsapp']`.
2. **Alt+0 limpa canais**: com `canais=['email']`, `Alt+0` chama `onChange([])`.
3. **Funciona com foco em input**: renderiza um `<input>` ao lado, foca nele, dispara `Alt+3` → `onChange` chamado com `['email']` (confirma que não é bloqueado por foco em input).
4. **Modo manual: Alt+N só altera pending**: `Alt+1` em modo manual → `onChange` NÃO é chamado, mas chip WhatsApp aparece selecionado.

### 4. (Opcional) Documentação rápida no header da `AdvancedSearchBar`

Hint discreto: já existe `KeyboardListHint`/`KeyboardHint` no design system. Não vou inflar a UI — a descoberta fica via tooltip dos chips + cheatsheet `?`.

## Padrões obrigatórios

- PT-BR, tokens semânticos, flat, zero novas deps.
- Não conflita com atalhos globais existentes (`Ctrl+K`, `Ctrl+B`, `?`, `j/k/Enter/x`).
- Funciona com foco em inputs (requisito explícito).
- Cleanup correto do listener no unmount.
- Backward compat total: nada quebra se ninguém pressionar `Alt`.

## Arquivos tocados

**Editados (2-3):**
- `src/components/interactions/CanaisQuickFilter.tsx` — listener global, badge `Alt+N`, tooltips atualizadas.
- `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx` — 4 testes novos.
- (Se aplicável) `src/hooks/useKeyboardShortcutsEnhanced.ts` ou registry — registrar atalhos para aparecerem na cheatsheet `?`.

## Critério de fechamento

(a) `Alt+1`…`Alt+6` alternam os chips correspondentes mesmo com foco em input; (b) `Alt+0` limpa canais; (c) toast curto confirma a ação; (d) badges `Alt+N` aparecem nos chips ao segurar `Alt`; (e) tooltips dos chips listam o atalho; (f) cheatsheet `?` lista os 7 atalhos sob "Filtros de canal"; (g) modos auto e manual respeitam seus contratos; (h) sem conflito com `Ctrl+K`/`Ctrl+B`/`?`; (i) testes cobrem auto, limpar, foco em input e modo manual; (j) PT-BR, flat, tokens semânticos, zero novas deps.

