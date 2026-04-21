

# Plano: Exportar e importar presets de buscas avançadas em /interacoes

## Contexto

Hoje o `InteracoesPresetsMenu` (popover "Buscas") deixa salvar/aplicar/remover presets via `useSearchPresets('interactions')` em `localStorage`. Não há jeito de levar um preset de um navegador para outro. Vamos adicionar **exportar** (arquivo JSON ou link compartilhável) e **importar** (colar JSON ou abrir link), usando apenas o navegador — sem backend.

## Decisão de escopo

- **Dois caminhos por preset individual:**
  1. **Exportar JSON** → baixa `busca-{slug}.json` com payload assinado por versão.
  2. **Copiar link** → URL `/interacoes?preset=<base64url>` que, ao abrir em outro navegador, oferece importar.
- **Importar em massa**: ação no rodapé do menu — abre dialog com tabs "Colar JSON" / "Importar arquivo". Permite múltiplos presets em um único JSON.
- **Auto-import por URL**: ao detectar `?preset=…`, mostra `<Dialog>` "Importar busca compartilhada?" com preview (nome + summary). Confirmar adiciona ao `localStorage` e remove o param. Cancelar só limpa o param.
- **Formato versionado** (`v: 1`) para evolução futura sem quebrar imports antigos:
  ```json
  { "v": 1, "kind": "interacoes-search-preset", "exportedAt": "...", "presets": [{ "name": "...", "filters": {...}, "sortBy": "", "sortOrder": "desc" }] }
  ```
- **Validação rigorosa**: shape check com Zod-like guard manual (sem nova dep), ignora campos desconhecidos, rejeita arquivo inválido com toast claro. Reaproveita estrutura `SearchPreset['filters']` já usada no menu.
- **Limite de 10 presets** (já enforced no hook) → import respeita: se ultrapassar, toast "Limite de 10 buscas atingido — remova alguns antes de importar" e importa só os primeiros que couberem.
- **Dedup por nome**: ao importar, se já existir preset com o mesmo nome, sufixo `(importado)` ou `(2)`.
- **Escopo só para `/interacoes`**: aproveitamos o padrão e deixamos o tipo genérico para reaproveitar em Contatos/Empresas em entrega futura, mas a UI desta entrega só toca no `InteracoesPresetsMenu`.

## Implementação

### 1. Novo helper `src/lib/searchPresetTransport.ts` (~140 linhas)

```ts
export const PRESET_KIND = 'interacoes-search-preset';
export const PRESET_VERSION = 1;

export interface ExportablePreset {
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
export interface PresetBundle {
  v: number; kind: string; exportedAt: string;
  presets: ExportablePreset[];
}

export function buildBundle(presets: ExportablePreset[]): PresetBundle;
export function parseBundle(raw: string): { ok: true; bundle: PresetBundle } | { ok: false; reason: string };
export function bundleToBase64Url(bundle: PresetBundle): string;       // JSON → utf8 → base64url
export function base64UrlToBundle(b64: string): PresetBundle | null;
export function downloadBundleAsFile(bundle: PresetBundle, filename: string): void;
export function dedupeNameAgainst(existing: string[], proposed: string): string;
```

- Validação manual: checa `v === 1`, `kind === PRESET_KIND`, `Array.isArray(presets)`, cada item tem `name:string`, `filters:object`, etc.
- `base64url` puro (substitui `+/=` por `-_` e remove `=`) para link curto e seguro.
- `downloadBundleAsFile` cria `Blob` `application/json` e dispara `<a download>` (mesmo padrão do `intelExportUniversal`).

### 2. Estender `useSearchPresets` (sem quebrar API atual)

Adicionar:
```ts
importPresets(items: Omit<SearchPreset,'id'|'createdAt'>[]): { added: number; skipped: number };
```

- Respeita limite de 10. Faz dedup de `name` contra `presets` existentes via `dedupeNameAgainst`.
- Não substitui presets existentes — só adiciona.

### 3. Refatorar `InteracoesPresetsMenu.tsx`

- **Por linha de preset (na lista)**: adicionar dois ícones extras no `group-hover` (à esquerda do `Trash2`):
  - `<Download />` → baixa JSON daquele preset (1 item).
  - `<Link2 />` → copia link `${origin}/interacoes?preset=<b64>` para clipboard, toast "Link copiado".
- **No rodapé do popover**: novo botão `<Upload /> Importar buscas` que abre `<ImportPresetsDialog>`.
- **Botão "Exportar todas"** (só aparece se `presets.length >= 1`): baixa bundle com todas.

### 4. Novo componente `src/components/interactions/ImportPresetsDialog.tsx` (~180 linhas)

`<Dialog>` com `<Tabs>`:
- **Aba "Colar JSON"**: `<Textarea>` (até 50 KB) + botão "Importar".
- **Aba "Arquivo"**: `<Input type="file" accept="application/json,.json">` + drop zone leve.

Pré-visualização (após parse válido): lista com nome de cada preset + checkbox para escolher quais importar (default: todos marcados). Rodapé: "Importar selecionados (n)" + Cancelar.

Erros de parse mostram alerta inline em destrutivo. Sucesso: toast "n busca(s) importada(s)" + fecha.

### 5. Auto-import via URL em `Interacoes.tsx`

- `useEffect` único: lê `?preset=` do `useSearchParams`. Se válido, abre `<ConfirmImportDialog>` com preview (nome + summary). Remove o param logo após decidir (Confirmar ou Cancelar) com `setSearchParams({}, { replace: true })`.
- Se base64 inválido: toast `'Link de busca inválido'` + remove o param.
- Componente reutiliza `useSearchPresets('interactions').importPresets`.

### 6. Testes leves em `src/lib/__tests__/search-presets-filters.test.ts`

Adicionar describe `transport`:
- `buildBundle → parseBundle` round-trip.
- `bundleToBase64Url → base64UrlToBundle` round-trip.
- `parseBundle` rejeita: JSON inválido, `v` errado, `kind` errado, `presets` não-array, item sem `name`.
- `dedupeNameAgainst` produz `Foo`, `Foo (2)`, `Foo (3)`.

## Padrões obrigatórios

- PT-BR
- Tokens semânticos, flat (sem shadow/gradient)
- `React.memo` no Dialog
- Zero novas queries de rede
- Zero novas dependências (sem zod externo, sem libs de QR/clipboard extras — usa `navigator.clipboard`)
- Backward compat: presets atuais no `localStorage` continuam válidos, formato de export é só uma serialização paralela
- A11y: dialogs com título/descrição, foco no primeiro input

## Arquivos tocados

**Criados (2):**
- `src/lib/searchPresetTransport.ts`
- `src/components/interactions/ImportPresetsDialog.tsx`

**Editados (3):**
- `src/hooks/useSearchPresets.ts` — adicionar `importPresets`
- `src/components/interactions/InteracoesPresetsMenu.tsx` — botões de export por linha + rodapé importar/exportar todas
- `src/pages/Interacoes.tsx` — auto-import por `?preset=` com dialog de confirmação
- `src/lib/__tests__/search-presets-filters.test.ts` — testes do transporte

## Critério de fechamento

(a) Cada preset na lista tem ícones "Baixar JSON" e "Copiar link" no hover; (b) rodapé do popover tem "Importar buscas" e "Exportar todas"; (c) link `/interacoes?preset=<b64>` aberto em outro navegador exibe dialog de confirmação com nome + resumo e, ao confirmar, persiste no `localStorage`; (d) import valida shape (`v=1`, `kind`, `presets` array) e rejeita arquivos inválidos com toast claro; (e) dedup de nomes evita colisão (`Foo (2)`); (f) limite de 10 presets respeitado no import com mensagem clara; (g) zero regressão no salvar/aplicar/remover atual, no `useInteractionsAdvancedFilter`, no `SearchPresetsMenu` (Contatos/Empresas) ou no `useSearchPresets`; (h) PT-BR, tokens semânticos, flat, sem novas deps.

