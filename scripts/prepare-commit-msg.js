/**
 * prepare-commit-msg
 * - Autopone encabezado si falta (por defecto: "task: ").
 * - Normaliza tipos (feature->feat, bug/hotfix->fix).
 * - Arregla encabezados tipo "chore algo" -> "chore: algo".
 * - Inserta/actualiza "Descripción:" si falta.
 * - Genera automáticamente "Items" (Agregado/Cambiado/Eliminado) desde lo staged.
 * - Siempre incluye "Corregido:" con placeholder para que el usuario detalle.
 * - Detecta ticket del branch (ABC-123) y lo coloca en "Refs:".
 *
 * Nota: se salta merges (source === 'merge').
 */
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const msgFile = process.argv[2];
const source = (process.argv[3] || "").toLowerCase();

if (source === "merge") process.exit(0);

const allowedTypes = [
  "feat",
  "feature",
  "fix",
  "bug",
  "hotfix",
  "chore",
  "task",
  "refactor",
  "docs",
  "style",
  "test",
  "build",
  "ci",
  "perf",
  "revert",
];

const normalizeMap = new Map([
  ["feature", "feat"],
  ["bug", "fix"],
  ["hotfix", "fix"],
]);

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function getBranch() {
  return run("git rev-parse --abbrev-ref HEAD");
}

function detectTicket(str) {
  const m = (str || "").match(/[A-Z]{2,}-\d+/);
  return m ? m[0] : "";
}

function canonicalType(t) {
  const low = (t || "").toLowerCase();
  return normalizeMap.get(low) || low;
}

function hasValidHeader(line) {
  const types = Array.from(new Set(allowedTypes.map(canonicalType)));
  const group = types.join("|");
  const re = new RegExp(`^(${group})(\\([\\w.-\\/]+\\))?:\\s?.+`, "i");
  return re.test(line);
}

function autofixHeader(line) {
  // "chore algo" -> "chore: algo"
  const m = line.match(/^(\w+)\s+(.*)$/);
  if (m) {
    const t = canonicalType(m[1]);
    const ok = allowedTypes.map(canonicalType).includes(t);
    if (ok) return `${t}: ${m[2].trim()}`;
  }
  return line;
}

function readStagedNameStatus() {
  // robusto con -z (maneja espacios). Formato: <status>\0<path>\0[old]\0[new]\0...
  const raw = run("git diff --cached --name-status -z");
  if (!raw) return { added: [], changed: [], deleted: [], renamed: [] };
  const tokens = raw.split("\0").filter(Boolean);
  const added = [],
    changed = [],
    deleted = [],
    renamed = [];
  for (let i = 0; i < tokens.length; ) {
    const status = tokens[i++]; // e.g. "A", "M", "D", "R100", "C100"
    const code = status[0];
    if (code === "A" || code === "C") {
      const p = tokens[i++]; // new path
      added.push(p);
    } else if (code === "M" || code === "T" || code === "U") {
      const p = tokens[i++];
      changed.push(p);
    } else if (code === "D") {
      const p = tokens[i++];
      deleted.push(p);
    } else if (code === "R") {
      const oldP = tokens[i++],
        newP = tokens[i++];
      renamed.push([oldP, newP]);
      // cuenta como cambio también
      changed.push(newP);
    } else {
      // fallback: consume un path si existe
      if (i < tokens.length) i++;
    }
  }
  return { added, changed, deleted, renamed };
}

function formatList(label, arr, mapItem = (s) => s) {
  if (!arr || arr.length === 0) return [];
  const MAX = 30;
  const shown = arr.slice(0, MAX);
  const lines = [`- ${label}:`];
  for (const it of shown) lines.push(`  - ${mapItem(it)}`);
  if (arr.length > MAX) lines.push(`  - … y ${arr.length - MAX} más`);
  return lines;
}

function buildItemsSection() {
  const { added, changed, deleted, renamed } = readStagedNameStatus();
  const items = ["Items:"];

  items.push(...formatList("Agregado", added));
  items.push(...formatList("Cambiado", changed));
  items.push(...formatList("Eliminado", deleted));
  if (renamed.length) {
    items.push("- Renombrado:");
    for (const [o, n] of renamed) items.push(`  - ${o} → ${n}`);
  }

  // Siempre incluir "Corregido:" para que el usuario detalle lo realizado
  items.push("- Corregido:");
  items.push("  - (Describe brevemente el problema y la solución aplicada)");

  return items.concat([""]);
}

function ensureDescripcion(lines) {
  const has = lines.some((l) => /^Descripción:/i.test(l.trim()));
  if (has) return lines;
  const branch = getBranch();
  const ticket = detectTicket(branch);
  const block = [
    "",
    "Descripción:",
    "",
    "- ¿Qué se hizo?",
    "- ¿Por qué se hizo?",
    "",
    // Items se insertan/actualizan después
    `Refs: ${ticket || branch}`,
    "",
  ];
  return lines.concat(block);
}

function upsertItems(lines) {
  const startIdx = lines.findIndex((l) => /^Items\b/i.test(l.trim()));
  const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));

  const newItems = buildItemsSection();

  if (startIdx !== -1) {
    // Reemplazar hasta Refs o hasta un bloque en blanco doble
    const end = refsIdx !== -1 && refsIdx > startIdx ? refsIdx : lines.length;
    lines.splice(startIdx, end - startIdx, ...newItems);
    return lines;
  }

  // Insertar antes de Refs si existe, si no al final
  if (refsIdx !== -1) {
    lines.splice(refsIdx, 0, ...newItems);
  } else {
    lines.push(...newItems);
  }
  return lines;
}

// === flujo principal ===
const original = fs.readFileSync(msgFile, "utf8");
const lines = original.split(/\r?\n/);

// Localizar primera línea no vacía/no comentario
let firstIdx = lines.findIndex(
  (l) => l.trim() !== "" && !l.trim().startsWith("#"),
);
if (firstIdx === -1) {
  lines.unshift("task: ");
  firstIdx = 0;
} else {
  let first = lines[firstIdx];

  // Normalizar alias y reparar encabezado sin ':'
  first = autofixHeader(first);

  // Si aún no es válido, anteponer "task: "
  if (!hasValidHeader(first)) {
    // Si escribieron "feature:" → normalizar a "feat:"
    const m = first.match(/^(\w+)(\([^)]+\))?:\s*(.*)$/);
    if (m) {
      const t = canonicalType(m[1]);
      const rest = m[3] || "";
      if (allowedTypes.map(canonicalType).includes(t)) {
        first = `${t}${m[2] || ""}: ${rest}`.trim();
      }
    }
  }
  if (!hasValidHeader(first)) {
    first = `task: ${first.replace(/^(\s*:?)/, "").trim()}`;
  }
  lines[firstIdx] = first;
}

// Asegurar "Descripción:" y "Refs:"
let withDesc = ensureDescripcion(lines);
// Insertar/actualizar la sección Items (auto)
withDesc = upsertItems(withDesc);

// Guardar
fs.writeFileSync(msgFile, withDesc.join("\n"), "utf8");
