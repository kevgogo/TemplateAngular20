#!/usr/bin/env node
/**
 * prepare-commit-msg
 * - Usa lo que escribas (VS Code / GitHub Desktop) como subject y antepone un type según la rama.
 * - Tipo por defecto: chore. Reglas por rama:
 *   - bug/*, hotfix/*, fix/*        -> fix
 *   - feature/*, feat/*             -> feat
 *   - feature/bug_* (en el path)    -> fix (prioridad)
 *   - dev, qa, main                 -> chore
 * - Scope automático desde la rama (si hay "grupo/slug", usa el slug como scope).
 * - Normaliza alias: feature->feat, bug/hotfix->fix.
 * - Arregla "type subject" -> "type: subject" (si olvidas los dos puntos).
 * - Inserta:
 *   - "Descripción:" en una línea y el texto en la siguiente (obligatoria, validada por otro hook)
 *   - "Corregido:" en una línea y el texto en la siguiente (opcional)
 *   - Marcador "# ITEMS_AUTO" para que otro hook agregue Items.
 *   - "Refs:" con ticket detectado por nombre de rama (ABC-123) como footer.
 * - Hace fallback a .git/COMMIT_EDITMSG si $1 no llega (VS Code / GitHub Desktop).
 * - Se salta commits de merge.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");
const source = (process.argv[3] || "").toLowerCase();
if (source === "merge") process.exit(0);

// -------- Helpers --------
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

// Type por rama
function inferTypeFromBranch(branchRaw) {
  const b = (branchRaw || "").toLowerCase();
  if (/\/bug[_-]/.test(b)) return "fix";
  if (/^(bug|hotfix|fix)\//.test(b)) return "fix";
  if (/^(feature|feat)\//.test(b)) return "feat";
  if (/^(dev|qa|main)$/.test(b)) return "chore";
  return "chore";
}

// Scope desde la rama (usa el slug después del "/")
function inferScopeFromBranch(branchRaw) {
  const b = (branchRaw || "").toLowerCase();
  if (!b.includes("/")) return "";
  const afterSlash = b.split("/")[1] || "";
  const cleaned = afterSlash
    .replace(/^bug[_/-]/, "")
    .replace(/^feat(ure)?[_/-]/, "")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "";
}

const BRANCH = getBranch();
const EFFECTIVE_TYPE = inferTypeFromBranch(BRANCH);
const SCOPE = inferScopeFromBranch(BRANCH);

// Tipos y normalización
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
const normalize = new Map([
  ["feature", "feat"],
  ["bug", "fix"],
  ["hotfix", "fix"],
]);
const canon = (t) =>
  normalize.get(String(t || "").toLowerCase()) || String(t || "").toLowerCase();

function validHeader(line) {
  const types = Array.from(new Set(allowedTypes.map(canon))).join("|");
  return new RegExp(`^(${types})(\\([\\w./-]+\\))?:\\s?.+`, "i").test(line);
}
// Arregla "type scope? subject" -> "type(scope)?: subject"
function autofixHeader(line) {
  const m = line.match(/^(\w+)(\([^)]+\))?\s+(.*)$/);
  if (m) {
    const t = canon(m[1]);
    const scope = m[2] || "";
    if (allowedTypes.map(canon).includes(t))
      return `${t}${scope}: ${m[3].trim()}`;
  }
  return line;
}

// -------- Proceso --------
const original = fs.readFileSync(msgFile, "utf8");
const lines = original.split(/\r?\n/);

// 1) Header: subject + type/scope
let firstIdx = lines.findIndex(
  (l) => l.trim() !== "" && !l.trim().startsWith("#"),
);
if (firstIdx === -1) {
  const head = SCOPE ? `${EFFECTIVE_TYPE}(${SCOPE}):` : `${EFFECTIVE_TYPE}:`;
  lines.unshift(head);
  firstIdx = 0;
} else {
  let first = autofixHeader(lines[firstIdx]);
  if (!validHeader(first)) {
    const m = first.match(/^(\w+)(\([^)]+\))?:\s*(.*)$/);
    if (m) {
      const t = canon(m[1]);
      const givenScope = m[2] || "";
      const rest = (m[3] || "").trim();
      if (allowedTypes.map(canon).includes(t)) {
        first = rest ? `${t}${givenScope}: ${rest}` : `${t}${givenScope}:`;
      } else {
        const head = givenScope
          ? `${EFFECTIVE_TYPE}${givenScope}:`
          : SCOPE
            ? `${EFFECTIVE_TYPE}(${SCOPE}):`
            : `${EFFECTIVE_TYPE}:`;
        first = rest ? `${head} ${rest}` : head;
      }
    } else {
      const subject = first.replace(/^(\s*:?)/, "").trim();
      const head = SCOPE
        ? `${EFFECTIVE_TYPE}(${SCOPE}):`
        : `${EFFECTIVE_TYPE}:`;
      first = subject ? `${head} ${subject}` : head;
    }
  }
  first = first.replace(/\s+$/, ""); // sin espacio de cola
  lines[firstIdx] = first;
}

// 2) Cuerpo: asegurar "Descripción:" en línea siguiente, mover body de Desktop si existe
const DESC_RE = /^\s*Descripci(?:ó|o)n:\s*$/i; // con/sin acento
const hasDescripcion = lines.some((l) => DESC_RE.test(l.trim()));
const hasCorregido = lines.some((l) => /^Corregido:\s*$/i.test(l.trim()));
const hasItemsMark = lines.some((l) => /ITEMS_AUTO/.test(l));

if (!hasDescripcion) {
  const ticket = detectTicket(BRANCH);

  // Captura body actual (VS Code/CLI/ GitHub Desktop) que esté después del header
  const tail = lines.slice(firstIdx + 1);
  const bodyUserLines = [];
  for (const l of tail) {
    const t = l.trim();
    if (t.startsWith("#")) continue; // ignora comentarios
    // no traigas bloques propios si ya existieran por algún motivo
    if (
      DESC_RE.test(t) ||
      /^Corregido:\s*$/i.test(t) ||
      /^Refs:\s*/i.test(t) ||
      /ITEMS_AUTO/.test(t)
    )
      break;
    bodyUserLines.push(l);
  }

  // limpiamos el resto del mensaje para reinyectar nuestra estructura
  lines.splice(firstIdx + 1);

  // Primera línea de la descripción = primera línea no vacía del body del usuario
  const firstBodyIdx = bodyUserLines.findIndex((l) => l.trim().length > 0);
  const descFirst =
    firstBodyIdx >= 0
      ? bodyUserLines[firstBodyIdx].trim()
      : "[Reemplaza el texto aqui]";
  const descRest =
    firstBodyIdx >= 0 ? bodyUserLines.slice(firstBodyIdx + 1) : [];

  // Inserción estructurada
  lines.push(
    "",
    "Descripción:",
    descFirst,
    ...descRest,
    "",
    "Corregido:",
    "[Reemplaza el texto aqui]",
    "",
    "# ITEMS_AUTO (los ítems se autogenerarán al confirmar el commit)",
    "",
    `Refs: ${ticket || BRANCH}`,
    "",
  );
} else {
  // Asegura Corregido
  if (!hasCorregido) {
    const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));
    const block = ["", "Corregido:", "[Reemplaza el texto aqui]", ""];
    if (refsIdx !== -1) lines.splice(refsIdx, 0, ...block);
    else lines.push(...block);
  }
  // Asegura marcador de Items
  if (!hasItemsMark) {
    const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));
    const mark = [
      "# ITEMS_AUTO (los ítems se autogenerarán al confirmar el commit)",
      "",
    ];
    if (refsIdx !== -1) lines.splice(refsIdx, 0, ...mark);
    else lines.push(...mark);
  }
}

// 3) Guardar
fs.writeFileSync(msgFile, lines.join("\n"), "utf8");
