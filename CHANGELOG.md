# Changelog

Todas as mudanças notáveis do SINGU CRM são documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.8.0] - 2026-04-12

### Segurança
- Substituído CORS wildcard `*` por `scopedCorsHeaders` dinâmico em 6 Edge Functions
- Adicionados testes automatizados para validação de security headers e CORS
- Zero vulnerabilidades high/critical (npm audit clean)

### Documentação
- Criado `docs/RUNBOOK.md` — runbook operacional completo (deploy, rollback, incidentes)
- Criado `CHANGELOG.md` com histórico de releases

### Performance
- Otimizado carregamento do módulo Empresas: `LISTING_SELECT` (~30 colunas vs SELECT *)
- Reduzido `INITIAL_FAST_LOAD` para 100 registros para primeira pintura rápida
- Implementado `countMethod: 'planned'` para contagens estimadas no banco externo

## [1.7.0] - 2026-04-11

### Adicionado
- Voice Agent com ElevenLabs (TTS + conversational AI)
- Agente de voz `elevenlabs-tts` e `voice-agent` Edge Functions
- Token de autenticação Scribe para sessões de voz

### Segurança
- Rate limiting com sliding window em Edge Functions
- Proteção anti brute force no login (5 tentativas / 15 min, bloqueios progressivos)
- Headers HTTP de segurança: CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy

## [1.6.0] - 2026-04-10

### Adicionado
- Sistema Lux Intelligence (enriquecimento automático de contatos/empresas)
- Integração Evolution API para WhatsApp
- Integração Bitrix24 para registro de chamadas
- Firecrawl scraping para dados web
- EnrichLayer para enriquecimento LinkedIn

### Melhorado
- Circuit breaker para resiliência de integrações externas
- Resilient fetch com retry exponencial
- Logger centralizado substituindo console.log em libs

## [1.5.0] - 2026-04-08

### Adicionado
- Análise DISC com AI (perfil comportamental de contatos)
- Análise RFM (Recência, Frequência, Valor Monetário)
- Sistema de insights AI com geração automática
- AI Writing Assistant para composição de mensagens
- Smart Reminders com sugestão inteligente de follow-ups

### Melhorado
- PWA com Service Worker e caching offline (NetworkFirst + CacheFirst)
- Web Vitals monitoring em produção

## [1.4.0] - 2026-04-05

### Adicionado
- Dashboard com métricas de pipeline e atividades recentes
- Weekly Digest (relatório semanal automatizado)
- Sistema de notificações push
- Health check endpoint com monitoramento de DB

### Melhorado
- Search unaccent para busca sem acentos (contatos, empresas, interações)
- Audit trail automático para operações CRUD

## [1.3.0] - 2026-04-02

### Adicionado
- Módulo de Empresas com dados do banco externo (220 tabelas)
- Mapa interativo de empresas (Leaflet + MarkerCluster)
- Filtros avançados com 30+ critérios
- Sistema de cooperativas (singular, central, confederação)

### Melhorado
- Paginação server-side com batch loading
- Formatação automática de CNPJ, capital social, razão social

## [1.2.0] - 2026-03-28

### Adicionado
- Módulo de Contatos com CRUD completo
- Sistema de interações (reuniões, calls, emails, notas)
- Relationship Score e Relationship Stage
- Análise de sentimento em interações
- Cadência de contato com lembretes automáticos

### Segurança
- RLS em todas as tabelas (user_id scoping)
- RBAC com tabela user_roles e função has_role()
- Autenticação Supabase com email + Google OAuth

## [1.1.0] - 2026-03-22

### Adicionado
- Sistema de automação (rules + triggers + actions)
- Templates de mensagens com variáveis dinâmicas
- Favoritos de templates
- Sistema de alertas e compatibilidade

## [1.0.0] - 2026-03-15

### Adicionado
- Lançamento inicial do SINGU CRM
- Autenticação com email/senha e Google
- Dashboard principal
- Perfil de usuário
- Tema claro/escuro
- Layout responsivo mobile-first
