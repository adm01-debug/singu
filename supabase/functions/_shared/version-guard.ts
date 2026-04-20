/**
 * Version Guard — helper compartilhado para optimistic locking.
 *
 * Padroniza a resposta HTTP 409 (`CONCURRENT_EDIT`) emitida quando uma operação
 * `update_with_version` falha por divergência de versão. Garante payload uniforme
 * para que o frontend (`ConcurrentEditError` em `src/lib/externalData.ts`) reconheça
 * o erro independente da tabela/edge function que o emitiu.
 *
 * Uso:
 *   const rows = Array.isArray(data) ? data : [];
 *   const guard = assertVersionMatch(rows, { entity: table, id, attemptedVersion: version, req });
 *   if (guard) return guard; // já devolve 409 padronizado
 *   return jsonOk({ data: rows[0] }, req);
 */
import { jsonError } from "./auth.ts";

export interface VersionGuardOptions {
  entity: string;
  id: string;
  attemptedVersion: number;
  req: Request;
}

/**
 * Devolve `null` se o UPDATE conditional retornou ao menos 1 linha (versão bateu).
 * Devolve uma `Response` 409 padronizada se nenhuma linha foi afetada (conflito).
 */
export function assertVersionMatch(
  rows: unknown[],
  opts: VersionGuardOptions,
): Response | null {
  if (Array.isArray(rows) && rows.length > 0) return null;
  // Payload uniforme — frontend reconhece via `CONCURRENT_EDIT` no message
  return jsonError(
    `CONCURRENT_EDIT entity=${opts.entity} id=${opts.id} attemptedVersion=${opts.attemptedVersion}`,
    409,
    opts.req,
  );
}
