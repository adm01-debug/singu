
O usuário quer execução autônoma sequencial até 10/10. Preciso definir QUAL melhoria começar agora. Olhando o estado atual: acabamos de entregar a Suíte de Enriquecimento (gaps 6 e 7 da lista de Data Enrichment & Intelligence). Os 5 itens "já cobertos" foram apenas validados conceitualmente, mas há gaps reais de UX/integração que merecem virar a próxima melhoria.

Análise rápida do que falta para 10/10 no domínio Enrichment + integração:

1. **Badges de validação inline em ContatoDetalhe** — hoje a suíte só vive em `/enrichment`. Validação não aparece ao lado do email/phone do contato.
2. **Botão "Validar tudo" no contato** — dispara verify+phone em paralelo automaticamente.
3. **Accordion "People Intelligence" no ContatoDetalhe** — timeline já existe mas não está plugada no detalhe.
4. **Auto-validação on insert** — trigger DB que enfileira validação ao criar/editar email/phone do contato.
5. **pg_cron de revalidação** — re-verifica emails com >30 dias.
6. **Coluna best_email no email_finder UI** — botão "usar este email" que cria/atualiza email no contato.

Vou executar UMA melhoria por vez começando pela de maior impacto visível: **integração da suíte no ContatoDetalhe** (itens 1+2+3 juntos formam uma unidade coerente de UX).

## Melhoria #1: Integrar Suíte de Enriquecimento no ContatoDetalhe

### Escopo
- Adicionar `EnrichmentBadges` ao lado de cada email/phone listado em `ContactDataTab` (PhonesCard, EmailsCard) mostrando status colorido + score via última verificação
- Botão "Validar tudo" no header do ContatoDetalhe que dispara `email-verifier` + `phone-validator` em paralelo para todos os contatos do registro
- Nova aba/accordion "Intelligence" no ContatoDetalhe com `PeopleIntelTimeline` daquele contato
- Hook auxiliar `useContactValidationStatus(contactId)` que retorna o último status por email/phone

### Arquivos
- Novo: `src/components/enrichment/EnrichmentBadge.tsx` (badge compacto reutilizável)
- Novo: `src/components/enrichment/ValidateAllButton.tsx` (botão no header)
- Novo: `src/hooks/useContactValidationStatus.ts`
- Editar: `src/components/contact-detail/data-tab/PhonesCard.tsx` — render badge ao lado do número
- Editar: `src/components/contact-detail/data-tab/EmailsCard.tsx` — render badge ao lado do email
- Editar: `src/pages/ContatoDetalhe.tsx` — botão Validar tudo no header + accordion People Intel
- Atualizar memória `mem://features/email-phone-validation-suite` mencionando integração

### Validação
- Abrir um contato com 1 email + 1 phone
- Clicar "Validar tudo" → 2 toasts, badges aparecem
- Conferir registros em `email_verifications` e `phone_validations` via SQL
- Atualizar role_title do contato → conferir entry em `people_intelligence_events` aparece no accordion

### Restrições
- Mantenho ≤400 linhas por arquivo
- Sem `any`, sem `useEffect` para fetch
- Português em toda UI/textos
- Não toco em ABM, Lead Scoring, Intent ou outros módulos

Após concluir #1 e validar, sigo automaticamente para #2 (auto-validação on insert via trigger DB) e assim por diante até esgotar a lista.
