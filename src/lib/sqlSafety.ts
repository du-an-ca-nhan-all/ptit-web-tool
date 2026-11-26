const SAFE_SQL_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates that a dynamic SQL table/column/type identifier contains only safe characters
 * before interpolating it into a quoted PostgreSQL identifier (`"${name}"`).
 */
export function assertSafeSqlIdentifier(identifier: string, label = 'SQL identifier'): string {
  if (!identifier || !SAFE_SQL_IDENTIFIER_RE.test(identifier)) {
    throw new Error(`[SEC-03] Unsafe ${label}: "${identifier}"`);
  }
  return identifier;
}
