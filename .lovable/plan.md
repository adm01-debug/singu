
# Plano de Integração: Contatos 10/10

## Contexto
O BD externo possui 40 RPCs de contatos e 5 campos sem cobertura no frontend. A edge function `external-data` não suporta chamadas RPC.

---

## Fase 1: Infraestrutura RPC na Edge Function
- Nova ação `rpc` no `external-data` com allowlist de RPCs permitidas
- Helper `callExternalRpc()` em `src/lib/externalData.ts`

## Fase 2: Campos Faltantes no Frontend (5 campos)
- `extra_data` → ExtraDataCard na aba Dados
- `deleted_by` → SoftDeletePanel
- `bitrix_contact_id` + `bitrix_created_at` → BitrixIntegrationCard
- `assigned_by_id` → Overview do contato

## Fase 3: Hooks para RPCs Prioritárias
- `useContactIntelligence` → get_contact_intelligence
- `useBestContactTime` → get_best_contact_time
- `useDuplicateContacts` → get_duplicate_contacts
- `useBirthdayContacts` → get_birthday_contacts
- `useOrphanContacts` → get_orphan_contacts

## Fase 4: Widgets UI
- Widget "Inteligência 360°" na overview
- Widget "Melhor Momento" na overview
- Widget "Aniversariantes" no Dashboard
- Painel "Contatos Órfãos" na qualidade de dados

## Ordem: Fase 1 → 2 → 3 → 4
