#!/usr/bin/env bash
# ============================================================================
# SINGU CRM — Audit Script para Edge Functions
#
# Verifica se cada edge function tem alguma forma de autenticação.
# Sai com código 1 se encontrar funções sem auth.
#
# Uso:
#   ./scripts/audit-edge-functions.sh
#
# Adicione ao CI:
#   - name: Audit edge functions auth
#     run: ./scripts/audit-edge-functions.sh
# ============================================================================

set -e

FUNCTIONS_DIR="supabase/functions"
EXIT_CODE=0

# Funções que NÃO precisam de auth (lista de exceções explícitas)
WHITELIST=(
  "_shared"  # não é função, é helper
)

echo "🔍 SINGU CRM — Auditoria de autenticação em edge functions"
echo "================================================================"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "❌ Diretório $FUNCTIONS_DIR não encontrado"
  exit 1
fi

# Conta funções
TOTAL=0
COMPLIANT=0
NONCOMPLIANT=0

for fn_dir in "$FUNCTIONS_DIR"/*/; do
  fn_name=$(basename "$fn_dir")

  # Skip whitelist
  if [[ " ${WHITELIST[@]} " =~ " ${fn_name} " ]]; then
    continue
  fi

  index_file="${fn_dir}index.ts"
  if [ ! -f "$index_file" ]; then
    continue
  fi

  TOTAL=$((TOTAL + 1))

  # Checa se tem alguma forma de auth
  has_with_auth=$(grep -c "withAuth\|authenticateRequest" "$index_file" || echo 0)
  has_webhook_secret=$(grep -c "requireWebhookSecret\|x-bitrix-secret\|x-evolution-secret\|x-lux-secret" "$index_file" || echo 0)
  has_cron_secret=$(grep -c "requireCronSecret\|x-cron-secret" "$index_file" || echo 0)

  if [ "$has_with_auth" -gt 0 ] || [ "$has_webhook_secret" -gt 0 ] || [ "$has_cron_secret" -gt 0 ]; then
    if [ "$has_with_auth" -gt 0 ]; then
      kind="JWT"
    elif [ "$has_webhook_secret" -gt 0 ]; then
      kind="WEBHOOK"
    else
      kind="CRON"
    fi
    echo "✅ $fn_name ($kind)"
    COMPLIANT=$((COMPLIANT + 1))
  else
    echo "❌ $fn_name — NO AUTH FOUND"
    NONCOMPLIANT=$((NONCOMPLIANT + 1))
    EXIT_CODE=1
  fi
done

echo "================================================================"
echo "Total: $TOTAL | Compliant: $COMPLIANT | NonCompliant: $NONCOMPLIANT"

if [ "$EXIT_CODE" -ne 0 ]; then
  echo ""
  echo "❌ FAIL — Existem funções sem autenticação."
  echo "Aplique withAuth, requireWebhookSecret ou requireCronSecret nelas."
  echo "Veja docs/SECURITY.md para o padrão."
fi

exit $EXIT_CODE
