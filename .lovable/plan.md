

# Plano: Mascaramento opcional de IP na listagem e detalhes

## Diagnóstico

- O IP aparece em vários pontos da UI: `IPRestrictionManager.tsx` (badge "Seu IP atual"), lista de IPs permitidos, `IncomingWebhookLogsDialog.tsx` (`l.source_ip`), e provavelmente em logs de auditoria/segurança.
- Hoje IPs são exibidos crus, o que pode expor dados sensíveis em screenshots, gravações de tela ou compartilhamento de telas.
- A busca/filtragem por IP precisa continuar funcionando mesmo com mascaramento ativo — o filtro deve operar sobre o valor original, não sobre a string mascarada.

## Escopo

Mascaramento como **preferência de exibição global** (toggle persistente em `localStorage`), aplicado em todos os pontos onde IP é renderizado. Filtros e buscas continuam usando o IP original.

## O que será construído

### 1. Utilitário `src/lib/ipMasking.ts` (novo, ~40 linhas)

```ts
export function maskIPv4(ip: string): string  // 192.168.1.10 → 192.168.*.*
export function maskIPv6(ip: string): string  // mantém prefixo /48, mascara resto
export function maskIP(ip: string | null | undefined): string  // detecta v4/v6
export function matchIP(ip: string, query: string): boolean    // substring no ORIGINAL
```

Regras:
- IPv4: mantém os 2 primeiros octetos, mascara os 2 últimos com `*`.
- IPv6: mantém os 3 primeiros grupos, substitui restantes por `*`.
- Inválido / vazio: retorna `'—'`.
- `matchIP(ip, query)` faz `ip.toLowerCase().includes(query.toLowerCase())` no valor cru, ignorando o mascaramento.

### 2. Hook `src/hooks/useIPMaskingPreference.ts` (novo, ~30 linhas)

- Estado global via `localStorage` chave `singu:mask-ips` (default `false`).
- Expõe `{ masked: boolean, toggle: () => void, setMasked: (v: boolean) => void }`.
- Sincroniza entre abas via evento `storage`.
- Sem `useEffect` para fetch (apenas para listener de storage, que é uso correto).

### 3. Componente `src/components/security/IPDisplay.tsx` (novo, ~25 linhas)

Componente de apresentação reutilizável:
```tsx
<IPDisplay ip={ip} className="font-mono" showToggle={false} />
```
- Lê `useIPMaskingPreference()`.
- Renderiza `maskIP(ip)` ou `ip` conforme preferência.
- `title` HTML mostra sempre o IP completo no hover (acessibilidade — usuário consegue ver quando precisa).
- Quando `showToggle`, renderiza um pequeno botão `Eye/EyeOff` ao lado para alternar globalmente.

### 4. Toggle global no header de Segurança

Em `src/pages/Security.tsx`, adicionar no `<header>` um pequeno controle:
- `Switch` + label "Mascarar IPs" (size sm, à direita do título).
- Persistência via `useIPMaskingPreference`.

### 5. Aplicação nos pontos de exibição

**`src/components/security/IPRestrictionManager.tsx`:**
- Badge "Seu IP atual": substituir `{ipInfo.ip}` por `<IPDisplay ip={ipInfo.ip} />`.
- Lista: substituir `<p className="text-sm font-mono">{ip.ip_address}</p>` por `<IPDisplay ip={ip.ip_address} className="text-sm font-mono" />`.
- Filtro de busca (se houver) continua usando `ip.ip_address` cru.

**`src/components/admin/conexoes/IncomingWebhookLogsDialog.tsx`:**
- Substituir `<span className="text-muted-foreground">{l.source_ip}</span>` por `<IPDisplay ip={l.source_ip} className="text-muted-foreground" />`.

**Outros pontos** (a localizar via `code--search_files` por `ip_address|source_ip|client_ip` durante implementação):
- Logs de auditoria, sessões ativas, dispositivos conhecidos, notificações de novo dispositivo.
- Aplicar `<IPDisplay>` em todos.

### 6. Filtragem preserva IP original

Em qualquer input de busca por IP (ex.: `IPRestrictionManager` se tiver, e em logs):
- A função de filtro recebe `ip.ip_address` (cru) e o `query`, usa `matchIP(ip.ip_address, query)`.
- Resultado: usuário digita `192.168` e encontra IPs que começam com isso, mesmo que a UI esteja mostrando `192.168.*.*`.

## Critérios de aceite

(a) Existe `src/lib/ipMasking.ts` com `maskIPv4`, `maskIPv6`, `maskIP` e `matchIP`; (b) hook `useIPMaskingPreference` persiste em `localStorage` (`singu:mask-ips`) e sincroniza entre abas; (c) componente `<IPDisplay>` renderiza IP mascarado ou cru conforme preferência, com `title` mostrando sempre o IP completo; (d) toggle "Mascarar IPs" aparece no header de `/security` e alterna a preferência globalmente; (e) `IPRestrictionManager` (badge "Seu IP atual" + lista) e `IncomingWebhookLogsDialog` (logs) usam `<IPDisplay>`; (f) outros pontos identificados via busca (`ip_address|source_ip|client_ip`) recebem o mesmo tratamento; (g) buscas/filtros por IP continuam funcionando contra o valor original via `matchIP`, independentemente do estado de mascaramento; (h) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (i) sem mudanças em hooks de fetch, RLS, tabelas, ou estrutura de dados; (j) sem regressão em layout responsivo, copy, ou demais funcionalidades dos componentes tocados.

