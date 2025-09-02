/**
 * Falla el commit si "Descripción:" no tiene texto real (más allá de placeholders).
 * "Corregido:" queda opcional.
 */
const fs = require("fs");
const path = require("path");

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");
const raw = fs.readFileSync(msgFile, "utf8");
const lines = raw.split(/\r?\n/);

function isComment(l) {
  const t = l.trim();
  return (
    t.startsWith("#") ||
    t.startsWith("//") ||
    t.startsWith("<!--") ||
    t.startsWith("-->")
  );
}

function findSection(startRegex) {
  const start = lines.findIndex(
    (l) => !isComment(l) && startRegex.test(l.trim()),
  );
  if (start === -1) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const t = lines[i];
    const s = t.trim();
    // Cortamos si aparece otro encabezado típico o fin de bloque
    if (
      /^Refs:/i.test(s) ||
      /^Items:/i.test(s) ||
      /^Corregido:/i.test(s) ||
      // línea vacía seguida de un encabezado
      (s === "" &&
        i + 1 < lines.length &&
        /^[A-ZÁÉÍÓÚÑ][\w\s()\/.-]+:$/i.test(lines[i + 1].trim()))
    )
      break;
    if (!isComment(t)) out.push(t);
  }
  return out;
}

const descBlock = findSection(/^Descripción:/i);

// Filtra placeholders y ruido
const PLACEHOLDERS = new Set([
  "- ¿Qué se hizo?".toLowerCase(),
  "- ¿Por qué se hizo?".toLowerCase(),
]);
const cleaned = descBlock
  .map((l) => l.replace(/\s+/g, " ").trim())
  .filter((l) => l.length > 0)
  .filter((l) => !PLACEHOLDERS.has(l.toLowerCase()));

// Exige al menos N caracteres “reales”
const MIN = 20;
const total = cleaned.join(" ");
if (total.length < MIN) {
  console.error(
    `\n✖ "Descripción:" es obligatoria. Agrega texto propio (≥ ${MIN} caracteres) y no solo placeholders.`,
  );
  process.exit(1);
}

process.exit(0);
