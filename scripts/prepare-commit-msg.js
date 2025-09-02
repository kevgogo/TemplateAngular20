#!/usr/bin/env node
/**
 * prepare-commit-msg
 * - Usa lo que escribas en VS Code como subject y antepone un type según la rama.
 * - Tipo por defecto: chore. Reglas por rama:
 *   - bug/*, hotfix/*, fix/*  -> fix
 *   - feature/*, feat/*       -> feat
 *   - dev, qa, main           -> chore
 *   - feature/bug_*           -> fix (prioriza "bug_" en el path)
 * - Normaliza alias: feature->feat, bug/hotfix->fix.
 * - Arregla "type subject" -> "type: subject" (si olvidas los dos puntos).
 * - Inserta "Descripción:" (obligatoria), "Corregido:" (opcional),
 *   y un marcador "# ITEMS_AUTO" para que otro hook agregue Items.
 * - Añade Refs con ticket detectado por nombre de rama (ABC-123) como footer.
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

// Detección de tipo por rama
function inferTypeFromBranch(branchRaw) {
  const b = (branchRaw || "").toLowerCase();
  // Cualquier segmento "bug_" tras un slash indica fix
  if (/\/bug[_-]/.test(b)) return "fix";
  if (/^(bug|hotfix|fix)\//.test(b)) return "fix";
  if (/^(feature|feat)\//.test(b)) return "feat";
  if (/^(dev|qa|main)$/.test(b)) return "chore";
  return "chore";
}

const DEFAULT_TYPE = "chore";
const BRANCH = getBranch();
const EFFECTIVE_TYPE = inferTypeFromBranch(BRANCH);

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

function canon(t) {
  const low = (t || "").toLowerCase();
  return normalize.get(low) || low;
}
function validHeader(line) {
  const types = Array.from(new Set(allowedTypes.map(canon))).join("|");
  return new RegExp(`^(${types})(\\([\\w./-]+\\))?:\\s?.+`, "i").test(line);
}
function autofixHeader(line) {
  // "chore mi cambio" -> "chore: mi cambio"
  const m = line.match(/^(\w+)\s+(.*)$/);
  if (m) {
    const t = canon(m[1]);
    if (allowedTypes.map(canon).includes(t)) return `${t}: ${m[2].trim()}`;
  }
  return line;
}

// -------- Proceso --------
const original = fs.readFileSync(msgFile, "utf8");
const lines = original.split(/\r?\n/);

// 1) Header: usar lo escrito en la 1ª línea como subject; anteponer type por rama
let firstIdx = lines.findIndex(
  (l) => l.trim() !== "" && !l.trim().startsWith("#"),
);
if (firstIdx === -1) {
  // No escribiste nada en la primera línea
  lines.unshift(`${EFFECTIVE_TYPE}:`); // sin espacio si no hay subject
  firstIdx = 0;
} else {
  let first = autofixHeader(lines[firstIdx]);

  if (!validHeader(first)) {
    // ¿Es un header con otro type + scope?
    const m = first.match(/^(\w+)(\([^)]+\))?:\s*(.*)$/);
    if (m) {
      const t = canon(m[1]);
      const scope = m[2] || "";
      const rest = (m[3] || "").trim();
      if (allowedTypes.map(canon).includes(t)) {
        first = rest ? `${t}${scope}: ${rest}` : `${t}${scope}:`;
      } else {
        const subject = first.replace(/^(\s*:?)/, "").trim();
        first = subject
          ? `${EFFECTIVE_TYPE}: ${subject}`
          : `${EFFECTIVE_TYPE}:`;
      }
    } else {
      // Tomamos todo como subject
      const subject = first.replace(/^(\s*:?)/, "").trim();
      first = subject ? `${EFFECTIVE_TYPE}: ${subject}` : `${EFFECTIVE_TYPE}:`;
    }
  }

  // Evitar error de commitlint "header-trim"
  first = first.replace(/\s+$/, "");
  lines[firstIdx] = first;
}

// 2) Cuerpo: asegurar "Descripción:", "Corregido:" (opcional) y marcador Items
const hasDescripcion = lines.some((l) => /^Descripción:/i.test(l.trim()));
const hasCorregido = lines.some((l) => /^Corregido:/i.test(l.trim()));
const hasItemsMark = lines.some((l) => /ITEMS_AUTO/.test(l));

if (!hasDescripcion) {
  const ticket = detectTicket(BRANCH);
  // Descripción opcional con placeholder útil
  lines.push("", "Descripción:", "[Reemplaza el texto aqui]", "");
  // Corregido opcional con placeholder útil
  lines.push("", "Corregido:", "[Reemplaza el texto aqui]", "");

  // Marcador para que el hook commit-msg inserte automáticamente Items
  lines.push(
    "# ITEMS_AUTO (los ítems se autogenerarán al confirmar el commit)",
    "",
  );

  // Footer Refs (estándar)
  lines.push(`Refs: ${ticket || BRANCH}`, "");
} else {
  // Asegura "Corregido:" si no existe
  if (!hasCorregido) {
    const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));
    const block = [
      "",
      "Corregido:",
      "  - (Describe brevemente el problema y la solución aplicada si aplica el caso)",
      "",
    ];
    if (refsIdx !== -1) lines.splice(refsIdx, 0, ...block);
    else lines.push(...block);
  }
  // Asegura marcador Items
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

// 3) Guardar mensaje
fs.writeFileSync(msgFile, lines.join("\n"), "utf8");
