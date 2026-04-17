
Já existe `useAIWritingAssistant` + edge function `ai-writing-assistant` que cobre composição de email. Falta UX integrada: um composer dedicado, acessível globalmente, que use o assistente, permita refinar (mais curto, mais formal, traduzir, etc.) e copie/envie.

## Melhoria #7: AI Email Composer global

### UX
Novo componente `AIEmailComposer` (Dialog) com:
- Seletor de contato (SearchableSelect reutilizado, busca em `contacts` do user)
- Tipo de mensagem (follow_up, introduction, proposal, check_in, thank_you, meeting_request, custom)
- Tom (formal/casual/friendly) — botões pill
- Contexto adicional (Textarea opcional)
- Botão "Gerar com IA" → chama `useAIWritingAssistant.generateSuggestions`
- Lista de 1-3 sugestões em Cards (subject, message, CTA, reasoning expansível)
- Por sugestão: botões "Copiar", "Refinar" (popover com chips: 'Mais curto', 'Mais formal', 'Mais persuasivo', 'Adicionar urgência') e "Usar este" (copia para clipboard + toast)

### Refinamento
- Novo edge function `ai-email-refine` (Deno.serve + Zod + JWT + rate-limit) recebendo `{ original, instruction, tone }` → retorna `{ message, subject? }` via Lovable AI gateway (`google/gemini-3-flash-preview`)
- Hook `useEmailRefine()` (mutation TanStack Query)

### Integração
- Botão flutuante no header global (`AppHeader`/`Topbar`) com ícone `Mail + Sparkles` que abre o dialog
- Atalho de teclado `⌘+Shift+E` (registro via existing keyboard shortcut hook se houver, senão `useEffect` listener — exceção justificada por ser global UI side effect, não fetch)
- Em `ContatoDetalhe`, botão "Compor email com IA" pré-seleciona o contato

### Arquivos
- Novo: `supabase/functions/ai-email-refine/index.ts`
- Novo: `src/hooks/useEmailRefine.ts`
- Novo: `src/components/ai/AIEmailComposer.tsx` (dialog principal)
- Novo: `src/components/ai/AIEmailComposerTrigger.tsx` (botão global + atalho)
- Editar: `src/components/layout/AppHeader.tsx` (ou equivalente) — montar trigger
- Editar: `src/pages/ContatoDetalhe.tsx` — botão de atalho que abre composer com contato pré-selecionado (via Zustand store leve `useEmailComposerStore` para abrir/contexto)
- Novo: `src/store/emailComposerStore.ts` (Zustand: `isOpen`, `prefilledContactId`, `open()`, `close()`)
- Nova memória: `mem://features/ai-email-composer.md`

### Validação E2E
- Build limpo
- Abrir via botão global → escolher contato → tipo "follow_up" → "Gerar" → 1-3 sugestões aparecem
- "Refinar > Mais curto" → mensagem encurtada inline
- "Copiar" → toast + clipboard preenchido
- A partir de `ContatoDetalhe`, botão abre composer com contato pré-selecionado
- Atalho `⌘+Shift+E` abre o dialog

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch (atalho de teclado é exceção válida), PT-BR, reusar `useAIWritingAssistant` existente.

Após #7 → #8 (auto-resumo de threads de email longas com extração de action items, reusando padrão de meeting-summary).
