
Continuando a sequência. #2 entregue. Agora #3.

## Melhoria #3: "Usar este email" no EmailFinder + auto-aplicar no contato

### Escopo
Quando o EmailFinder encontra emails ranqueados, hoje só exibe a lista. Adicionar:
- Botão "Usar este email" em cada resultado → atualiza `contacts.email` (ou cria entry em `contact_emails` se já houver email principal)
- Se invocado com `contactId` no contexto, pré-preenche e salva direto
- Modo standalone (em `/enrichment`): mostra SearchableSelect de contato para destinar o email
- Marcar email escolhido como `is_primary` se contato não tinha email

### Arquivos
- Editar `src/components/enrichment/EmailFinderWidget.tsx` — botão por linha + handler
- Novo `src/hooks/useApplyFoundEmail.ts` — mutation que atualiza contato e invalida queries
- Editar `src/components/contact-detail/data-tab/EmailsCard.tsx` — botão "Buscar email" abre EmailFinder modal pré-preenchido com firstName/lastName/domain do contato
- Novo `src/components/enrichment/EmailFinderDialog.tsx` — wrapper modal reutilizável

### Validação
- Em ContatoDetalhe sem email: clicar "Buscar email" → modal abre pré-preenchido → escolher resultado → email salvo no contato + badge de validação aparece
- Em `/enrichment`: rodar finder → escolher contato → email aplicado
- Trigger DB de validação (#2) dispara automaticamente após update

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR. Reutilizar edge functions e hooks existentes.

Após #3 → #4 (revalidação manual em massa em /enrichment com seletor de filtros).
