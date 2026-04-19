
Vou explorar o projeto "palantine" para entender sua arquitetura, funções e design antes de propor a cópia.

Primeiro preciso localizar o projeto e mapear:
1. Stack e estrutura de diretórios
2. Funcionalidades principais (rotas/módulos)
3. Sistema de design (tokens, componentes)
4. Edge functions e schema de banco
5. Hooks e padrões arquiteturais

Depois vou comparar com o SINGU (projeto atual) para identificar:
- O que já existe (não duplicar)
- O que é novo (copiar)
- O que conflita (decidir prioridade)

Como o pedido é amplo ("copie arquitetura, funções e design"), preciso saber o escopo real antes de mergulhar. Copiar um sistema inteiro sem critério vai:
- Quebrar a stack atual (SINGU é CRM Nexus Blue, design flat minimal — pode ser incompatível com Palantine)
- Conflitar com memórias core (português obrigatório, sem produtos/propostas, máx 400 linhas)
- Gerar centenas de arquivos sem necessidade

Vou apresentar um plano de exploração + decisão de escopo.

---

# Plano: Análise e portabilidade do Palantine → SINGU

## Fase 1 — Descoberta (read-only, ~5 min)

1. Localizar projeto via `cross_project--search_project` com query "palantine"
2. Listar estrutura raiz e `src/` para mapear stack
3. Ler `ARCHITECTURE.md` / `README.md` se existirem
4. Listar `src/pages/` para inventário de rotas/módulos
5. Listar `supabase/functions/` para edge functions
6. Ler `tailwind.config.ts` + `index.css` para design tokens
7. Listar `src/components/ui/` para componentes custom

## Fase 2 — Comparação com SINGU

Cruzar inventário do Palantine com o que SINGU já tem (61 edge functions, módulos Pipeline/ABM/Lead Scoring/etc) e classificar cada item:
- **NOVO** — não existe no SINGU, candidato a portar
- **DUPLICADO** — já existe, descartar
- **CONFLITANTE** — existe versão diferente, precisa decisão
- **PROIBIDO** — viola memória core (ex: módulo Produtos)

## Fase 3 — Decisão de escopo (PRECISO DA SUA RESPOSTA)

"Copiar tudo" não é viável — viola constraints do projeto. Preciso que você escolha:

**Opção A — Auditoria + Relatório (recomendado)**
Entrego documento `PALANTINE_AUDIT.md` em `/mnt/documents/` com:
- Inventário completo (rotas, funções, design tokens)
- Tabela comparativa Palantine × SINGU
- Recomendações priorizadas (quick wins vs. grandes refatorações)
- Você escolhe o que portar em rounds futuros

**Opção B — Portar módulos específicos**
Você me diz quais (ex: "só o módulo X e o design system"). Aí faço plano cirúrgico.

**Opção C — Clonar design system apenas**
Tokens de cor, tipografia, componentes UI, sem lógica de negócio.

## Riscos de "copiar tudo cego"

- Round 1 ainda não fechou (auditoria de 58 RPCs em curso)
- SINGU tem 100+ memórias arquiteturais que seriam violadas
- Constraint "máx 400 linhas/arquivo" e "português obrigatório" podem não bater com Palantine
- Risco de quebrar build atual sem ganho claro

## Próximo passo

Aguardando sua escolha (A/B/C) **antes** de executar Fase 1. Se escolher B ou C, me diga o escopo exato.
