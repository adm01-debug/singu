

# Plano: Persistir e restaurar o estado aberto do WhyScoreDrawer ao trocar de contato

## Estado atual

`WhyScoreDrawer` é controlado por `open`/`onOpenChange`. Cada consumidor (ex.: `LeadScoreBadge`) mantém `useState(false)` local. Ao navegar entre contatos na Ficha 360 (`/contatos/:id`), o componente desmonta e monta de novo → o drawer sempre volta fechado, mesmo que o usuário estivesse comparando "por que" entre contatos.

## Objetivo

Se o usuário fechou o drawer com ele aberto e navega para outro contato (ou recarrega a página), o drawer deve **reabrir automaticamente** mostrando o score do novo contato. Quando o usuário **explicitamente fechar** o drawer (X / clique fora / ESC), a preferência é apagada e ele não reabre mais até ser aberto manualmente de novo.

## Mudanças

### 1. Novo hook `useWhyScoreDrawerPreference` (arquivo novo)

`src/hooks/useWhyScoreDrawerPreference.ts` (~50 linhas).

Persiste um único flag global em `sessionStorage` (chave `singu-whyscore-open-v1`). Por que sessionStorage e não localStorage: a "intenção de manter aberto" é uma preferência de sessão de trabalho, não cross-device. Sai quando fecha o navegador.

API:
```ts
export function useWhyScoreDrawerPreference(): {
  shouldAutoOpen: boolean;     // valor inicial lido do storage
  rememberOpen: () => void;    // grava flag = true
  forgetOpen: () => void;      // remove flag
};
```

Implementação: lê `sessionStorage` no `useState(() => ...)` para evitar flicker. `rememberOpen`/`forgetOpen` apenas escrevem/removem. Sem listeners cross-tab (não é necessário).

Tratamento defensivo: try/catch em todos os acessos a `sessionStorage` (modo privado, SSR).

### 2. `LeadScoreBadge` consome o hook

Em `src/components/lead-score/LeadScoreBadge.tsx`:

- importar `useWhyScoreDrawerPreference`.
- substituir `const [open, setOpen] = useState(false)` por:
  ```ts
  const { shouldAutoOpen, rememberOpen, forgetOpen } = useWhyScoreDrawerPreference();
  const [open, setOpen] = useState(shouldAutoOpen && interactive);
  ```
- handler de abertura (clique no badge): `setOpen(true); rememberOpen();`.
- callback do drawer: 
  ```ts
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) rememberOpen(); else forgetOpen();
  };
  ```
  e passar `onOpenChange={handleOpenChange}` ao `WhyScoreDrawer`.

Isto garante que: (a) ao navegar para outro contato e o `LeadScoreBadge` remontar com `interactive=true`, o drawer reaparece com os fatores do novo contato; (b) ao fechar manualmente, a flag é apagada e o drawer não reaparece em contatos seguintes.

Guard: só auto-abre se `interactive` for verdadeiro (badge sem `factors`/`contactId` não consegue abrir o drawer; abrir vazio seria pior UX).

### 3. Nada muda em outros consumidores

`ScoreProntidaoCard`, `DealRiskDrawer`, `WhyScoreDrawer` em si não precisam mudar. A persistência fica no consumidor específico que o usuário usa para "comparar entre contatos" (LeadScoreBadge na Ficha 360 é o caso real). Outros consumidores podem adotar o hook depois, se quiserem o mesmo comportamento.

## Critérios de aceite

(a) Abrir o drawer no contato A, navegar para o contato B → o drawer abre automaticamente em B com os fatores de B; (b) fechar o drawer (X, ESC ou clique fora) em qualquer contato → ao navegar para outro, o drawer fica fechado; (c) recarregar a página com drawer aberto: ao remontar a Ficha 360 do mesmo contato, o drawer volta aberto; após fechar o navegador, sessão expira; (d) badge não-interativo (sem `factors` ou `contactId`) nunca auto-abre, mesmo com flag setada; (e) sem nova dependência, sem `any`, PT-BR; (f) hook isolado e reusável (<60 linhas), `LeadScoreBadge` continua <120 linhas; (g) tratamento defensivo de `sessionStorage` (try/catch).

