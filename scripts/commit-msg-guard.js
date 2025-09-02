#!/usr/bin/env node
/**
 * Valida que la línea INMEDIATA a "Descripción:" tenga contenido real (≥ MIN chars).
 * - Acepta "Descripción:" y "Descripcion:" (con/sin acento).
 * - Placeholders tipo [Reemplaza...], [Describe...], TODO, Pendiente, etc., no cuentan.
 * - "Corregido:" es opcional.
 */
const fs = require("fs");
const path = require("path");

const MIN = 20;

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

const idx = lines.findIndex(
  (l) => !isComment(l) && /^\s*Descripci(?:ó|o)n:\s*$/i.test(l),
);
if (idx === -1) {
  console.error(
    '\n✖ Falta el bloque "Descripción:" (línea con solo "Descripción:")',
  );
  process.exit(1);
}

// Tomamos la línea inmediatamente siguiente (no saltamos líneas en blanco: deben escribir ahí)
const next = idx + 1 < lines.length ? lines[idx + 1] : "";
let content = (next || "")
  .replace(/^\s*[-*]\s+/, "")
  .replace(/\s+/g, " ")
  .trim();

// Si es un bracket/paréntesis con posible placeholder, filtra
const isPlaceholderInner = (s) =>
  /(reemplaza|describe|todo|pendiente|replace|fill|write|tbd)/i.test(s);
if (/^\s*\[.*\]\s*$/.test(content) || /^\s*\(.*\)\s*$/.test(content)) {
  const inner = content.replace(/^[\[\(]\s*|\s*[\]\)]$/g, "");
  content = isPlaceholderInner(inner) ? "" : inner.trim();
} else {
  // Borra placeholders sueltos entre [] o ()
  content = content
    .replace(/\[(.*?)\]|\((.*?)\)/g, (m, a, b) => {
      const inner = a ?? b ?? "";
      return isPlaceholderInner(inner) ? "" : inner;
    })
    .trim();
}

if (!content || content.length < MIN) {
  console.error(
    `\n✖ "Descripción:" es obligatoria en la línea siguiente. Escribe contenido propio (≥ ${MIN} caracteres) y no dejes placeholders sin reemplazar.\nEjemplo esperado:\n\nDescripción:\nSe refactorizó el scheduler para simplificar dependencias y mejorar legibilidad...`,
  );
  process.exit(1);
}

process.exit(0);
