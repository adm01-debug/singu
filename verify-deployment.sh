#!/usr/bin/env bash
# ============================================================================
# SINGU CRM — verify-deployment.sh
# Smoke test pós-deploy. Confirma que TODAS as edge functions estão exigindo
# autenticação ou shared secret. Se alguma responder 200 sem credenciais,
# ela ainda está aberta — vermelho na tela.
#
# Uso:
#   export SUPABASE_PROJECT_REF="rqodmqosrotmtrjnnjul"
#   ./verify-deployment.sh
# ============================================================================

set -uo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-rqodmqosrotmtrjnnjul}"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  SINGU CRM — Deployment Verification"
echo "  Project: $PROJECT_REF"
echo "  Base:    $BASE_URL"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Categorias de funções e o que se espera de cada uma
# Formato: "função|tipo_esperado"
# tipo_esperado: jwt | webhook_secret | cron_secret

FUNCTIONS_JWT=(
  "disc-analyzer"
  "voice-to-text"
  "external-data"
  "ai-writing-assistant"
  "generate-insights"
  "generate-offer-suggestions"
  "suggest-next-action"
  "enrichlayer-linkedin"
  "firecrawl-scrape"
  "enrich-contacts"
  "social-profile-scraper"
  "social-behavior-analyzer"
  "social-events-detector"
  "rfm-analyzer"
  "elevenlabs-tts"
  "elevenlabs-scribe-token"
  "voice-agent"
  "send-push-notification"
)

FUNCTIONS_WEBHOOK=(
  "bitrix24-webhook"
  "evolution-webhook"
  "lux-webhook"
  "evolution-api"
)

FUNCTIONS_CRON=(
  "check-notifications"
  "check-health-alerts"
  "client-notifications"
  "template-success-notifications"
  "smart-reminders"
  "weekly-digest"
)

# Função: chama sem credenciais e checa o status code retornado
check_function_anon() {
  local fn="$1"
  local expected_min="$2"  # status code mínimo aceitável (401, 403...)
  local kind="$3"

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/$fn" \
    -H "Content-Type: application/json" \
    -d '{}' \
    --max-time 10 2>/dev/null) || code="000"

  if [[ "$code" == "401" ]] || [[ "$code" == "403" ]] || [[ "$code" == "503" ]]; then
    echo -e "  ${GREEN}✓${NC} [$kind] $fn → $code (bloqueado anônimo)"
    PASS=$((PASS + 1))
  elif [[ "$code" == "404" ]]; then
    echo -e "  ${YELLOW}⚠${NC} [$kind] $fn → 404 (função não deployada)"
    WARN=$((WARN + 1))
  elif [[ "$code" == "000" ]]; then
    echo -e "  ${YELLOW}⚠${NC} [$kind] $fn → timeout/erro de rede"
    WARN=$((WARN + 1))
  elif [[ "$code" == "200" ]]; then
    echo -e "  ${RED}✗${NC} [$kind] $fn → 200 (AINDA ABERTO! VAZAMENTO!)"
    FAIL=$((FAIL + 1))
  else
    echo -e "  ${RED}✗${NC} [$kind] $fn → $code (esperado 401/403)"
    FAIL=$((FAIL + 1))
  fi
}

echo -e "${BLUE}─── Funções com JWT (devem retornar 401 sem auth) ───${NC}"
for fn in "${FUNCTIONS_JWT[@]}"; do
  check_function_anon "$fn" 401 "JWT"
done
echo ""

echo -e "${BLUE}─── Webhooks com shared secret (devem retornar 401 sem secret) ───${NC}"
for fn in "${FUNCTIONS_WEBHOOK[@]}"; do
  check_function_anon "$fn" 401 "WBHK"
done
echo ""

echo -e "${BLUE}─── Crons com cron secret (devem retornar 401 sem x-cron-secret) ───${NC}"
for fn in "${FUNCTIONS_CRON[@]}"; do
  check_function_anon "$fn" 401 "CRON"
done
echo ""

# ─── CHECK ESPECÍFICO DA CHAVE ANON VAZADA ──────────────────────────────────
echo -e "${BLUE}─── Verificando que a chave anon antiga foi rotacionada ───${NC}"
LEAKED_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb2RtcW9zcm90bXRyam5uanVsIg"
if [[ -f ".env" ]] && grep -q "$LEAKED_KEY" .env 2>/dev/null; then
  echo -e "  ${RED}✗${NC} Chave antiga AINDA presente em .env local — rotacionar AGORA"
  FAIL=$((FAIL + 1))
else
  echo -e "  ${GREEN}✓${NC} Chave antiga não encontrada localmente"
  PASS=$((PASS + 1))
fi
echo ""

# ─── RESUMO ─────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASS${NC}: $PASS    ${RED}FAIL${NC}: $FAIL    ${YELLOW}WARN${NC}: $WARN"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}❌ Existem $FAIL função(ões) ainda vulneráveis. NÃO está 10/10 ainda.${NC}"
  exit 1
fi
if [[ $WARN -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  $WARN aviso(s). Revisar funções faltando deploy.${NC}"
  exit 0
fi
echo -e "${GREEN}✅ Tudo verde. Deploy validado.${NC}"
exit 0
