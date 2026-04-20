#!/usr/bin/env bash
# Runner para testes RLS — executa cada arquivo .sql em tests/rls/
# Pré-req: variáveis PG* configuradas (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)

set -e

if [ -z "$PGHOST" ]; then
  echo "::warning::PGHOST não definido — pulando testes RLS"
  exit 0
fi

cd "$(dirname "$0")"
FAILED=0

for f in *.sql; do
  [ "$f" = "schema.sql" ] && continue
  echo "▶️  Rodando $f..."
  if psql -v ON_ERROR_STOP=1 -f "$f" > /tmp/rls-${f}.out 2>&1; then
    echo "✅ $f OK"
  else
    echo "❌ $f FALHOU"
    cat /tmp/rls-${f}.out
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -gt 0 ]; then
  echo "⚠️  $FAILED arquivo(s) com falhas"
  exit 1
fi

echo "✅ Todos os testes RLS passaram"
