// src/app/core/utils/colibri-auth.util.ts

/** Diccionario seguro para indexar */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Lee una ruta "a.b.c" (soporta índices de arreglo: "accounts.0.token") */
function getByPath(source: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = source;

  for (const p of parts) {
    if (Array.isArray(cur)) {
      const idx = Number(p);
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length)
        return undefined;
      cur = cur[idx];
      continue;
    }
    if (!isRecord(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Lee el token directamente de colibri_usr.token o del string plano guardado */
export function readColibriToken(storageKey = 'colibri_usr'): string | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;

  // 1) Intentar JSON
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed)) {
      const t = parsed['token'];
      if (typeof t === 'string' && t.length > 0) return t;
    }
    return null;
  } catch {
    // 2) Fallback: guardado como string plano (no JSON)
    return raw.length > 0 ? raw : null;
  }
}

/**
 * Lee un token desde `colibri_usr` siguiendo una ruta.
 * Ej.: "token", "account.access_token", "accounts.0.jwt"
 */
export function readColibriTokenBy(
  propPath = 'token',
  storageKey = 'colibri_usr',
): string | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;

  // 1) Intentar JSON
  try {
    const parsed: unknown = JSON.parse(raw);
    const value = getByPath(parsed, propPath);

    if (typeof value === 'string' && value.length > 0) return value;

    // Fallback común si la ruta apunta a un objeto contenedor
    if (isRecord(value)) {
      const candidates = ['token', 'access_token', 'accessToken', 'jwt'];
      for (const k of candidates) {
        const v = value[k];
        if (typeof v === 'string' && v.length > 0) return v;
      }
    }
    return null;
  } catch {
    // 2) Si guardaste un string plano y estás pidiendo "token", devuélvelo
    return propPath === 'token' && raw.length > 0 ? raw : null;
  }
}
