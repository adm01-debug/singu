

## Assunto e corpo separados no "Copiar script" (e-mail)

O `CopyScriptMenu` já exibe campo de assunto e botão "Copiar só o assunto" **quando** `s.subject` existe. O problema: o gerador atual (`generateScripts` em `src/lib/scriptGenerator.ts`) não está produzindo `subject` para o canal `email`, então o campo nunca aparece. Esta melhoria garante que todo script de e-mail tenha **assunto e corpo gerados automaticamente e separados**, com o botão de copiar só o assunto sempre disponível.

### O que será feito

**1. Garantir geração de `subject` para todo script de e-mail**

Em `src/lib/scriptGenerator.ts`:
- Adicionar helper `buildEmailSubject(passoId, firstName, sentiment)` que monta um assunto curto, contextual e personalizado por passo + sentimento.
- Garantir que **todo** `GeneratedScript` com `channel: 'email'` retorne `subject` preenchido (nunca `undefined`).
- Catálogo de assuntos por `passoId` (com fallback genérico):
  - `whatsapp-followup` / `ligacao-checkin` → "Retomando nossa conversa, {firstName}"
  - `email-nutricao` → "{firstName}, conteúdo que pode te interessar"
  - `agendar-reuniao` → "Proposta de horário para conversarmos"
  - `aniversario` → "Parabéns, {firstName}! 🎉"
  - `reativacao` / contato frio → "Faz tempo, {firstName} — tudo bem?"
  - fallback → "Olá, {firstName}"
- Variação por sentimento (`positive` → tom mais direto; `negative` → tom mais cuidadoso; `neutral` → padrão).

**2. Garantir corpo de e-mail próprio (não reaproveitar texto de WhatsApp)**

- Para cada cenário, gerar um `body` em formato de e-mail (saudação + parágrafo + assinatura placeholder), distinto do script de WhatsApp.
- Manter o limite de comprimento adequado (≤600 caracteres no corpo para legibilidade).

**3. Reforçar a UI do popover**

Em `src/components/ficha-360/CopyScriptMenu.tsx`:
- O bloco "Copiar só o assunto" já existe condicionado a `s.subject`. Como o gerador agora sempre devolve `subject` para e-mail, o botão fica **sempre visível** na aba E-mail.
- Pequeno ajuste visual: deixar o botão "Copiar só o assunto" com ícone `Copy` (h-3 w-3) e mover o contador de caracteres do corpo para a linha do label, evitando ficar ao lado do botão.
- Botão principal "Copiar" continua copiando `Assunto: ... \n\n {body}` (comportamento atual preservado).

**4. Toasts diferenciados**

- "Assunto copiado" ao usar o botão de assunto.
- "E-mail copiado (assunto + corpo)" ao usar o botão principal na aba e-mail.

### Arquivos afetados

- **Editado**: `src/lib/scriptGenerator.ts` — adicionar `buildEmailSubject`, garantir `subject` + `body` próprios para canal `email` em todos os passos.
- **Editado**: `src/components/ficha-360/CopyScriptMenu.tsx` — pequeno polimento visual do bloco de assunto e toasts diferenciados.

### Critérios de aceite

1. Ao abrir "Copiar script" → aba **E-mail** em qualquer próximo passo, o campo **Assunto** aparece preenchido automaticamente.
2. Botão **"Copiar só o assunto"** está sempre visível na aba E-mail e copia somente o texto do assunto.
3. Botão **Copiar** principal copia `Assunto: ... \n\n {corpo}`.
4. Assunto varia por `passoId` e por `sentiment` do contato.
5. Corpo do e-mail é distinto do script de WhatsApp para o mesmo passo.
6. Nenhuma regressão nos canais WhatsApp e Ligação.

