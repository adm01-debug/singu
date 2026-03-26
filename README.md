# SINGU CRM

<!-- Logo placeholder -->
<p align="center">
  <img src="/public/pwa-512x512.png" alt="SINGU CRM" width="120" />
</p>

<p align="center">
  <strong>CRM Inteligente para Gestao de Relacionamentos B2B</strong>
</p>

<p align="center">
  Sistema de Inteligencia Relacional com analise comportamental DISC, segmentacao RFM, insights por IA e grafo de relacionamentos.
</p>

---

## Visao Geral

O SINGU e um CRM moderno e inteligente, projetado para equipes comerciais B2B que precisam ir alem do cadastro basico de contatos. Ele combina gestao de relacionamentos com analises comportamentais avancadas, oferecendo recursos como perfil DISC automatizado, segmentacao RFM, previsao de churn, score de fechamento e um grafo interativo de rede de contatos.

A aplicacao e uma SPA (Single Page Application) construida com React e TypeScript, com backend no Supabase (banco de dados PostgreSQL, autenticacao, storage e edge functions). Suporta instalacao como PWA com funcionamento offline.

## Stack Tecnologica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Estilizacao** | Tailwind CSS 3, shadcn/ui (Radix UI), Framer Motion |
| **Estado e dados** | TanStack React Query 5, React Hook Form, Zod |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| **Graficos** | Recharts, react-force-graph-2d |
| **Busca** | Fuse.js (fuzzy search) |
| **PWA** | vite-plugin-pwa, Workbox |
| **Testes** | Vitest, Testing Library |
| **Lint** | ESLint 9, typescript-eslint |

## Funcionalidades

### Gestao de Contatos e Empresas
- Cadastro completo de contatos e empresas com campos personalizados
- Detalhe rico de contato com timeline de interacoes
- Edicao inline de campos
- Busca global com fuzzy search (Cmd+K)
- Acoes em lote (bulk actions)
- Exportacao de dados

### Analises Comportamentais
- **Perfil DISC** -- classificacao automatica do perfil comportamental do contato
- **Segmentacao RFM** -- Recencia, Frequencia e valor Monetario para priorizar contatos
- **Score de Fechamento** -- probabilidade estimada de conversao
- **Previsao de Churn** -- alertas de risco de perda de conta
- **Analise de Compatibilidade** -- compatibilidade entre voce e o contato
- **Deteccao de Coalizoes** -- identifica grupos de influencia

### Inteligencia e Insights
- Painel de insights gerados por IA
- Sugestoes de proxima acao (next best action)
- Lembretes inteligentes (smart reminders)
- Alertas de saude do relacionamento
- Melhor horario para contato
- Analise de estados emocionais
- Briefing diario
- Digest semanal

### Visualizacao e Analytics
- Dashboard com KPIs e graficos interativos
- Grafo de rede de relacionamentos (Network)
- Relatorio individual de contato
- Calendario de interacoes
- Neuromarketing e gatilhos comportamentais

### Interacoes e Comunicacao
- Registro de interacoes por canal (email, telefone, WhatsApp, reuniao)
- Integracao com Evolution API (WhatsApp)
- Voice-to-text para notas de reuniao
- Sugestoes de escrita com IA

### Experiencia do Usuario
- Tema claro/escuro
- Atalhos de teclado completos
- Transicoes de pagina animadas
- Onboarding guiado
- Notificacoes push
- Micro-interacoes e celebracoes
- Design system proprio

## Primeiros Passos

### Pre-requisitos

- **Node.js** >= 18 (recomendado 20+)
- **npm** >= 9
- Uma conta no [Supabase](https://supabase.com) com projeto configurado

### Instalacao

```bash
# 1. Clone o repositorio
git clone https://github.com/seu-usuario/singu.git
cd singu

# 2. Instale as dependencias
npm install

# 3. Configure as variaveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O servidor estara disponivel em `http://localhost:8080`.

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

| Variavel | Descricao | Obrigatoria |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase (ex: `https://xyz.supabase.co`) | Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publica (anon key) do Supabase | Sim |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase | Sim |
| `VITE_VAPID_PUBLIC_KEY` | Chave publica VAPID para push notifications | Nao |
| `VITE_APP_VERSION` | Versao da aplicacao (exibida na UI) | Nao |

## Estrutura do Projeto

```
src/
├── components/         # Componentes React organizados por dominio
│   ├── analytics/      # Graficos e dashboards
│   ├── briefing/       # Briefing diario
│   ├── bulk-actions/   # Acoes em lote
│   ├── carnegie/       # Principios de Dale Carnegie
│   ├── celebrations/   # Animacoes de celebracao
│   ├── company-card/   # Cards de empresa
│   ├── contact-card/   # Cards de contato
│   ├── dashboard/      # Componentes do dashboard
│   ├── data-export/    # Exportacao de dados
│   ├── disc/           # Perfil DISC
│   ├── feedback/       # Error boundaries, toasts
│   ├── filters/        # Filtros avancados
│   ├── forms/          # Formularios reutilizaveis
│   ├── inline-edit/    # Edicao inline
│   ├── keyboard/       # Atalhos de teclado
│   ├── layout/         # Layout principal (sidebar, header)
│   ├── lux/            # Gatilhos LUX
│   ├── navigation/     # Navegacao
│   ├── network/        # Grafo de rede
│   ├── neuromarketing/ # Neuromarketing
│   ├── nlp/            # Processamento de linguagem natural
│   ├── notifications/  # Notificacoes
│   ├── onboarding/     # Onboarding de usuario
│   ├── pwa/            # PWA (install prompt, offline)
│   ├── search/         # Busca global
│   ├── session/        # Gerenciamento de sessao
│   ├── settings/       # Configuracoes
│   ├── skeletons/      # Loading skeletons
│   ├── smart-reminders/# Lembretes inteligentes
│   ├── stakeholders/   # Mapa de stakeholders
│   ├── theme/          # Tema claro/escuro
│   ├── triggers/       # Gatilhos comportamentais
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── voice/          # Voice-to-text
├── hooks/              # Custom hooks (useContacts, useDISC, useRFM, etc.)
├── integrations/       # Integracao com Supabase (client, types, queries)
├── lib/                # Utilitarios (cn, helpers)
├── pages/              # Paginas da aplicacao
├── data/               # Dados estaticos e constantes
├── test/               # Setup de testes
└── types/              # Tipos TypeScript compartilhados
```

## Supabase

### Edge Functions

O projeto utiliza 27 edge functions para logica de servidor:

| Funcao | Descricao |
|---|---|
| `ai-writing-assistant` | Assistente de escrita com IA |
| `bitrix24-webhook` | Webhook de integracao Bitrix24 |
| `check-health-alerts` | Verificacao de alertas de saude |
| `check-notifications` | Verificacao de notificacoes |
| `client-notifications` | Notificacoes para clientes |
| `disc-analyzer` | Analise de perfil DISC |
| `enrich-contacts` | Enriquecimento de dados de contatos |
| `enrichlayer-linkedin` | Enriquecimento via LinkedIn |
| `evolution-api` | Integracao com Evolution API (WhatsApp) |
| `evolution-webhook` | Webhook da Evolution API |
| `external-data` | Busca de dados externos |
| `firecrawl-scrape` | Web scraping com Firecrawl |
| `generate-insights` | Geracao de insights por IA |
| `generate-offer-suggestions` | Sugestoes de ofertas |
| `health-check` | Health check do sistema |
| `lux-trigger` | Gatilho LUX |
| `lux-webhook` | Webhook LUX |
| `rfm-analyzer` | Analise de segmentacao RFM |
| `send-push-notification` | Envio de push notifications |
| `smart-reminders` | Lembretes inteligentes |
| `social-behavior-analyzer` | Analise de comportamento social |
| `social-events-detector` | Deteccao de eventos sociais |
| `social-profile-scraper` | Scraping de perfis sociais |
| `suggest-next-action` | Sugestao de proxima acao |
| `template-success-notifications` | Notificacoes de sucesso |
| `voice-to-text` | Conversao de voz para texto |
| `weekly-digest` | Resumo semanal |

### Migrations

O projeto possui 33 migrations SQL que configuram o schema do banco de dados, incluindo tabelas, funcoes RPC, politicas RLS e triggers.

## Scripts Disponiveis

```bash
npm run dev          # Servidor de desenvolvimento (porta 8080)
npm run build        # Build de producao
npm run build:dev    # Build em modo desenvolvimento
npm run preview      # Preview do build local
npm run lint         # Linting com ESLint
npm run type-check   # Verificacao de tipos TypeScript
npm run test         # Executa testes uma vez
npm run test:watch   # Testes em modo watch
npm run test:coverage # Testes com cobertura
```

## Build e Deploy

### Build de Producao

```bash
npm run build
```

O build gera arquivos otimizados na pasta `dist/` com code splitting automatico:

- `vendor-react` -- React, ReactDOM, React Router
- `vendor-supabase` -- Cliente Supabase
- `vendor-query` -- React Query
- `vendor-recharts` -- Graficos Recharts
- `vendor-motion` -- Framer Motion
- `vendor-radix` -- Componentes Radix UI

### Deploy na Vercel

1. Conecte o repositorio na [Vercel](https://vercel.com)
2. Configure as variaveis de ambiente no painel
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### Deploy na Netlify

1. Conecte o repositorio na [Netlify](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Adicione um arquivo `_redirects` na pasta `public/`:
   ```
   /*    /index.html   200
   ```

## PWA

O SINGU funciona como Progressive Web App em producao:

- **Service Worker** com Workbox para cache de assets estaticos
- **Estrategia NetworkFirst** para chamadas ao Supabase (cache de 24h, max 100 entradas)
- **Cache de ate 5MB** por arquivo estatico
- **Instalacao** na tela inicial do dispositivo (prompt automatico)
- **Indicador de status offline** na interface
- **Badge de status de rede** em tempo real

O manifesto define o app como `standalone` com orientacao `portrait`, ideal para uso mobile.

## Contribuindo

1. Faca um fork do repositorio
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faca commit das suas alteracoes (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Envie para o repositorio (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Convencoes

- Commits seguem o padrao [Conventional Commits](https://www.conventionalcommits.org/)
- Componentes React em PascalCase
- Hooks customizados com prefixo `use`
- Testes no diretorio `__tests__` adjacente ao codigo

## Licenca

Este projeto esta licenciado sob a [Licenca MIT](LICENSE).
