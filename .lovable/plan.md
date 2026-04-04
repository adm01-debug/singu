
# 🏗️ Plano: Adequar Frontend ao Schema Normalizado do Banco Externo

## Problema Atual
O formulário salva `phone`, `email`, `address`, `city`, `state`, `instagram`, `linkedin` etc. **diretamente na tabela `companies`** — mas essas colunas **não existem** no banco externo. O banco usa tabelas normalizadas separadas.

## Mapeamento: Atual → Correto

| Campo no Form | Onde salva hoje ❌ | Onde deveria salvar ✅ | Tabela |
|---|---|---|---|
| Fone Fixo 1/2 | `companies.phone` | `company_phones` (phone_type: `fixo_comercial`) | `company_phones` |
| Celular Corporativo | `companies.phone` | `company_phones` (phone_type: `celular_corporativo`) | `company_phones` |
| Email | `companies.email` | `company_emails` (email_type: `corporativo`) | `company_emails` |
| Website | `companies.website` | `company_social_media` (plataforma: `website`) | `company_social_media` |
| Endereço/Cidade/Estado | `companies.address/city/state` | `company_addresses` (logradouro, cidade, estado, CEP, bairro...) | `company_addresses` |
| Instagram/LinkedIn/etc | `companies.instagram/linkedin...` | `company_social_media` (plataforma: `instagram`/`linkedin`...) | `company_social_media` |

## Etapas de Implementação

### Etapa 1: Hooks CRUD para tabelas normalizadas
Criar hooks que fazem CRUD via edge function `external-data` para:
- `useCompanyPhones(companyId)` → lista/cria/edita/deleta em `company_phones`
- `useCompanyEmails(companyId)` → lista/cria/edita/deleta em `company_emails`  
- `useCompanyAddresses(companyId)` → lista/cria/edita/deleta em `company_addresses`
- `useCompanySocialMedia(companyId)` → lista/cria/edita/deleta em `company_social_media`

### Etapa 2: Refatorar abas do CompanyForm
- **Aba Básico**: Remover campos de phone/email (ficam apenas dados da empresa)
- **Aba Endereços**: Usar `company_addresses` (CEP, logradouro, número, complemento, bairro, cidade, estado, país, ponto de referência)
- **Aba Redes**: Usar `company_social_media` (com plataforma enum) + `company_emails`
- **Nova seção Telefones**: Usar `company_phones` com tipo (fixo_comercial, celular_corporativo)

### Etapa 3: Fluxo de criação em 2 passos
1. Primeiro salva a empresa (tabela `companies`) 
2. Depois salva os dados relacionados (phones, emails, addresses, social_media) usando o `company_id` retornado

### Etapa 4: Fluxo de edição
- Ao abrir edição, carregar dados de todas as tabelas relacionadas
- Ao salvar, atualizar/criar/deletar registros nas tabelas normalizadas

## Campos Expandidos (baseados no schema real)

### `company_addresses` (24 colunas)
- tipo, CEP, logradouro, número, complemento, bairro, cidade, estado, país
- latitude/longitude, ponto de referência, instruções de entrega, horário funcionamento
- Google Maps URL, Google Place ID

### `company_phones` (16 colunas)  
- phone_type (enum: fixo_comercial, celular_corporativo, celular_pessoal)
- número, ramal, is_primary, is_whatsapp, departamento, observação

### `company_emails` (14 colunas)
- email_type (enum: corporativo, pessoal, financeiro, nfe, marketing)
- email, is_primary, departamento, observação, is_verified

### `company_social_media` (16 colunas)
- plataforma (enum: linkedin, instagram, facebook, x, youtube, tiktok, website)
- handle, URL, nome_perfil, is_verified, is_active, seguidores

## Impacto
- ~4 novos hooks
- ~4 novos componentes de formulário (sub-formulários por aba)
- Refatoração do `CompanyForm.tsx`
- Sem alterações no banco de dados (apenas uso correto das tabelas existentes)
