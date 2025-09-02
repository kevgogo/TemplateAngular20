#!/usr/bin/env node
/**
 * Valida que la línea INMEDIATA a "Descripción:" tenga contenido real (≥ MIN chars).
 * - Formato esperado:
 *     Descripción:
 *     <tu texto aquí>
 * - Placeholders como [Reemplaza ...], [Describe ...], TODO, Pendiente, etc. NO cuentan.
 * - "Corregido:" es opcional (no se valida aquí).
 */
const fs = require("fs");
const path = require("path");

const MIN = 20; // mínimo de caracteres reales requeridos

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");
const raw = fs.readFileSync(msgFile, "utf8");
const lines = raw.split(/\r?\n/);

function isComment(s) {
  const t = (s || "").trim();
  return (
    t.startsWith("#") ||
    t.startsWith("//") ||
    t.startsWith("<!--") ||
    t.startsWith("-->")
  );
}

// Busca la primera línea "Descripción:" (no comentario)
const idx = lines.findIndex(
  (l) => !isComment(l) && /^\s*Descripción:\s*$/i.test(l),
);
if (idx === -1) {
  console.error(
    '\n✖ Falta el bloque "Descripción:" (línea con solo "Descripción:")',
  );
  process.exit(1);
}

// Toma la SIGUIENTE línea no comentario (si hay líneas en blanco, se consideran vacías)
let next = idx + 1 < lines.length ? lines[idx + 1] : "";
while (isComment(next)) {
  // si justo la siguiente es un comentario, considera la siguiente real como vacía para forzar edición
  const probe = lines.slice(idx + 1).find((l) => !isComment(l));
  next = typeof probe === "string" ? probe : "";
  break;
}

// Normaliza bullets y espacios
let content = (next || "")
  .replace(/^\s*[-*]\s+/, "") // quita bullet inicial
  .replace(/\s+/g, " ") // espacios múltiples -> uno
  .trim();

// Quita brackets/paréntesis si son placeholder obvio; si no, conserva el texto interno
const removeIfPlaceholder = (s) => {
  const inner = s.replace(/^[\[\(]\s*|\s*[\]\)]$/g, "");
  return /(reemplaza|describe|todo|pendiente|replace|fill|write|tbd)/i.test(
    inner,
  )
    ? ""
    : inner;
};

// Si es [ ... ] o ( ... ), decide si es placeholder
if (/^\s*\[.*\]\s*$/.test(content) || /^\s*\(.*\)\s*$/.test(content)) {
  content = removeIfPlaceholder(content);
} else {
  // Aunque no esté entero entre []/(), limpia placeholders obvios sueltos
  content = content.replace(/\[(.*?)\]|\((.*?)\)/g, (_, a, b) =>
    removeIfPlaceholder(_),
  );
}

// Validaciones
if (!content || content.length < MIN) {
  console.error(
    `\n✖ "Descripción:" es obligatoria en la línea siguiente. Escribe contenido propio (≥ ${MIN} caracteres) y no dejes placeholders sin reemplazar.\nEjemplo esperado:\n\nDescripción:\nSe refactorizó el scheduler para simplificar dependencias y mejorar legibilidad...`,
  );
  process.exit(1);
}

process.exit(0);
