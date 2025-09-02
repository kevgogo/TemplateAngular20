/* Prepara el mensaje para edición:
   - Header: normaliza type o pone "task: " por defecto.
   - Inserta "Descripción:" si falta.
   - Inserta "Corregido:" con placeholder (visible ANTES del commit).
   - Deja marcador para que "Items:" se autogenere al confirmar (commit-msg).
*/
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");
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
const normalize = new Map([
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
function ticket(s) {
  const m = (s || "").match(/[A-Z]{2,}-\d+/);
  return m ? m[0] : "";
}
function canon(t) {
  const low = (t || "").toLowerCase();
  return normalize.get(low) || low;
}

function validHeader(line) {
  const types = Array.from(new Set(allowedTypes.map(canon))).join("|");
  return new RegExp(`^(${types})(\\([\\w.-\\/]+\\))?:\\s?.+`, "i").test(line);
}
function autofixHeader(line) {
  const m = line.match(/^(\w+)\s+(.*)$/);
  if (m) {
    const t = canon(m[1]);
    if (allowedTypes.map(canon).includes(t)) return `${t}: ${m[2].trim()}`;
  }
  return line;
}

const original = fs.readFileSync(msgFile, "utf8");
const lines = original.split(/\r?\n/);

// Header
let firstIdx = lines.findIndex(
  (l) => l.trim() !== "" && !l.trim().startsWith("#"),
);
if (firstIdx === -1) {
  lines.unshift("task:"); // sin espacio
  firstIdx = 0;
} else {
  let first = autofixHeader(lines[firstIdx]);
  if (!validHeader(first)) {
    const m = first.match(/^(\w+)(\([^)]+\))?:\s*(.*)$/);
    if (m) {
      const t = canon(m[1]);
      const rest = (m[3] || "").trim();
      if (allowedTypes.map(canon).includes(t)) {
        first = rest ? `${t}${m[2] || ""}: ${rest}` : `${t}${m[2] || ""}:`;
      }
    }
  }
  if (!validHeader(first)) {
    const rest = first.replace(/^(\s*:?)/, "").trim();
    first = rest ? `task: ${rest}` : "task:"; // sin trailing space si no hay subject
  }
  first = first.replace(/\s+$/, ""); // trim de cola
  lines[firstIdx] = first;
}

// Descripción
if (!lines.some((l) => /^Descripción:/i.test(l.trim()))) {
  const br = getBranch();
  const tk = ticket(br);
  lines.push(
    "",
    `Refs: ${tk || br}`,
    "Descripción:",
    "- ¿Qué se hizo?",
    "-- [Escribe aqui lo que hiciste  ]",
    "",
    "Corregido:",
    "  - (Describe brevemente el problema y la solución aplicada si aplica el caso)",
    "",
    "# ITEMS_AUTO (los ítems se autogenerarán al confirmar el commit)",
  );
} else {
  // Asegura bloque Corregido si no existe
  const hasCorr = lines.some((l) => /^Corregido:/i.test(l.trim()));
  if (!hasCorr) {
    // Inserta antes de Refs si existe
    const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));
    const block = [
      "",
      "Corregido:",
      "  - (Describe brevemente el problema y la solución aplicada)",
      "",
    ];
    if (refsIdx !== -1) lines.splice(refsIdx, 0, ...block);
    else lines.push(...block);
  }
  // Asegura marcador
  if (!lines.some((l) => /ITEMS_AUTO/.test(l))) {
    const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));
    const mark = [
      "# ITEMS_AUTO (los ítems se autogenerarán al confirmar el commit)",
      "",
    ];
    if (refsIdx !== -1) lines.splice(refsIdx, 0, ...mark);
    else lines.push(...mark);
  }
}

fs.writeFileSync(msgFile, lines.join("\n"), "utf8");
