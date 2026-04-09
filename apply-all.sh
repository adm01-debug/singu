#!/usr/bin/env bash
# ============================================================================
# SINGU CRM — apply-all.sh
# Aplica TODOS os patches do pacote singu_patches/ no repo local de uma vez.
#
# Uso (do terminal local, com o repo singu já clonado):
#   1. Baixe a pasta singu_patches/ do Claude para sua máquina
#   2. Coloque este script no topo do repo singu (ao lado do package.json)
#   3. Edite a variável PATCHES_DIR abaixo apontando pra pasta baixada
#   4. chmod +x apply-all.sh
#   5. ./apply-all.sh
# ============================================================================

set -euo pipefail

# ─── CONFIG (edite essa linha) ──────────────────────────────────────────────
PATCHES_DIR="${PATCHES_DIR:-$HOME/Downloads/singu_patches}"
BRANCH_NAME="${BRANCH_NAME:-security/hardening-2026-04-09}"
COMMIT_MSG="security: hardening — auth, webhook secrets, sanitization, audit log, docs, tests, CI"

# ─── CORES ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()    { echo -e "${GREEN}✓${NC} $1"; }
info()  { echo -e "${BLUE}ℹ${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; exit 1; }

# ─── PRE-FLIGHT ─────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  SINGU CRM — Hardening Apply Script"
echo "════════════════════════════════════════════════════════════════"
echo ""

[[ -d "$PATCHES_DIR" ]] || fail "Pasta de patches não existe: $PATCHES_DIR (edite PATCHES_DIR no topo do script)"
[[ -f "package.json" ]] || fail "Não estou na raiz do repo singu (package.json não encontrado)"
command -v git >/dev/null || fail "git não instalado"

info "Repo:        $(pwd)"
info "Patches:     $PATCHES_DIR"
info "Branch alvo: $BRANCH_NAME"
echo ""

# ─── CONFIRMAÇÃO ────────────────────────────────────────────────────────────
read -p "Continuar? (s/N) " -n 1 -r
echo ""
[[ $REPLY =~ ^[Ss]$ ]] || { warn "Cancelado"; exit 0; }
echo ""

# ─── BRANCH ─────────────────────────────────────────────────────────────────
info "Garantindo working tree limpo..."
if [[ -n "$(git status --porcelain)" ]]; then
  fail "Você tem mudanças não commitadas. Faça stash ou commit antes."
fi
ok "Working tree limpo"

info "Atualizando main..."
git checkout main >/dev/null 2>&1 || git checkout master >/dev/null 2>&1
git pull --ff-only
ok "main atualizado"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  warn "Branch $BRANCH_NAME já existe — fazendo checkout"
  git checkout "$BRANCH_NAME"
else
  info "Criando branch $BRANCH_NAME..."
  git checkout -b "$BRANCH_NAME"
  ok "Branch criado"
fi
echo ""

# ─── COPIA DOS PATCHES ──────────────────────────────────────────────────────
copy_file() {
  local src="$1"
  local dst="$2"
  if [[ ! -f "$PATCHES_DIR/$src" ]]; then
    warn "  pulando (não existe): $src"
    return
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$PATCHES_DIR/$src" "$dst"
  ok "  $dst"
}

info "─── Aplicando patches de segurança (edge functions) ───"
copy_file "supabase/functions/_shared/auth.ts"            "supabase/functions/_shared/auth.ts"
copy_file "supabase/functions/bitrix24-webhook/index.ts"  "supabase/functions/bitrix24-webhook/index.ts"
copy_file "supabase/functions/evolution-webhook/index.ts" "supabase/functions/evolution-webhook/index.ts"
copy_file "supabase/functions/lux-webhook/index.ts"       "supabase/functions/lux-webhook/index.ts"
copy_file "supabase/functions/disc-analyzer/index.ts"     "supabase/functions/disc-analyzer/index.ts"
copy_file "supabase/functions/voice-to-text/index.ts"     "supabase/functions/voice-to-text/index.ts"
copy_file "supabase/functions/external-data/index.ts"     "supabase/functions/external-data/index.ts"
echo ""

info "─── Aplicando templates pra novas funções ───"
copy_file "supabase/functions/_template-authenticated/index.ts" "supabase/functions/_template-authenticated/index.ts"
copy_file "supabase/functions/_template-cron/index.ts"          "supabase/functions/_template-cron/index.ts"
echo ""

info "─── Aplicando migrations SQL ───"
copy_file "supabase/migrations/20260409_security_hardening.sql"        "supabase/migrations/20260409_security_hardening.sql"
copy_file "supabase/migrations/20260409_dashboard_materialized_views.sql" "supabase/migrations/20260409_dashboard_materialized_views.sql"
copy_file "supabase/migrations/20260409_dashboard_rpcs.sql"            "supabase/migrations/20260409_dashboard_rpcs.sql"
echo ""

info "─── Aplicando documentação ───"
copy_file "docs/SECURITY.md"        "docs/SECURITY.md"
copy_file "docs/ARQUITETURA.md"     "docs/ARQUITETURA.md"
copy_file "docs/POPs_PROCESSOS.md"  "docs/POPs_PROCESSOS.md"
copy_file "docs/KPIs_GESTAO.md"     "docs/KPIs_GESTAO.md"
copy_file "docs/SCHEMA.md"          "docs/SCHEMA.md"
echo ""

info "─── Aplicando testes ───"
copy_file "src/__tests__/auth-helpers.test.ts"  "src/__tests__/auth-helpers.test.ts"
copy_file "src/__tests__/edge-functions.test.ts" "src/__tests__/edge-functions.test.ts"
echo ""

info "─── Aplicando observabilidade e dashboards ───"
copy_file "src/lib/sentry.ts"                       "src/lib/sentry.ts"
copy_file "src/pages/DashboardOperacional.tsx"      "src/pages/DashboardOperacional.tsx"
copy_file "src/pages/DashboardTatico.tsx"           "src/pages/DashboardTatico.tsx"
copy_file "src/pages/DashboardEstrategico.tsx"      "src/pages/DashboardEstrategico.tsx"
echo ""

info "─── Aplicando CI/CD e scripts ───"
copy_file ".github/workflows/ci.yml"          ".github/workflows/ci.yml"
copy_file "scripts/audit-edge-functions.sh"   "scripts/audit-edge-functions.sh"
copy_file ".env.example"                      ".env.example"
echo ""

info "─── Aplicando rate limiter (Cloudflare Worker) ───"
copy_file "cloudflare-rate-limiter/src/index.ts"  "cloudflare-rate-limiter/src/index.ts"
copy_file "cloudflare-rate-limiter/wrangler.toml" "cloudflare-rate-limiter/wrangler.toml"
echo ""

# ─── PERMISSÕES DOS SCRIPTS ─────────────────────────────────────────────────
[[ -f "scripts/audit-edge-functions.sh" ]] && chmod +x scripts/audit-edge-functions.sh
[[ -f "apply-all.sh" ]] && chmod +x apply-all.sh
ok "Scripts marcados como executáveis"
echo ""

# ─── DIFF SUMMARY ───────────────────────────────────────────────────────────
info "─── Resumo das mudanças ───"
git status --short
echo ""

# ─── COMMIT + PUSH ──────────────────────────────────────────────────────────
read -p "Fazer commit e push agora? (s/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
  git add .
  git commit -m "$COMMIT_MSG" \
             -m "Vê PR description em PR_DESCRIPTION.md (gerado pelo apply-all.sh)" \
             -m "Co-authored-by: Claude <noreply@anthropic.com>"
  ok "Commit criado"

  info "Fazendo push..."
  git push -u origin "$BRANCH_NAME"
  ok "Push concluído"
  echo ""

  REMOTE_URL=$(git remote get-url origin | sed -e 's|git@github.com:|https://github.com/|' -e 's|\.git$||')
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  ✓ PRONTO. Abre o PR aqui:"
  echo ""
  echo "  $REMOTE_URL/compare/main...$BRANCH_NAME?expand=1"
  echo ""
  echo "  Cola a description que está em: PR_DESCRIPTION.md"
  echo "════════════════════════════════════════════════════════════════"
else
  warn "Commit pulado. Mudanças aplicadas no working tree do branch $BRANCH_NAME."
  warn "Pra commitar manualmente:"
  echo "  git add ."
  echo "  git commit -m \"$COMMIT_MSG\""
  echo "  git push -u origin $BRANCH_NAME"
fi
echo ""
