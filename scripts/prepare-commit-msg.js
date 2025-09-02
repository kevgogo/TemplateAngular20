#!/usr/bin/env node
/**
 * prepare-commit-msg
 * - Funciona con VS Code, CLI y GitHub Desktop.
 * - Usa tu texto como subject y antepone un type según la rama.
 *   · bug/*, hotfix/*, fix/*        -> fix
 *   · feature/*, feat/*             -> feat
 *   · feature/bug_* (en el path)    -> fix (prioridad)
 *   · dev, qa, main                 -> chore
 * - Scope automático desde la rama (usa el slug después del "/").
 * - Normaliza alias: feature->feat, bug/hotfix->fix.
 * - Autocorrige "type scope? subject" -> "type(scope)?: subject"
 *   SOLO si el token de tipo está en minúsculas (evita que "TEST ..." sea "test: ...").
 * - Si el subject viene TODO en MAYÚSCULAS, lo pasa a minúsculas SOLO en el header
 *   (la “Descripción” queda como la escribas).
 * - Inserta:
 *   · "Descripción:" en una línea y el texto en la siguiente (obligatoria; otro hook valida).
 *   · "Corregido:" en una línea y el texto en la siguiente (opcional).
 *   · Marcador "# ITEMS_AUTO" para que otro hook agregue Items.
 *   · "Refs:" con ticket detectado por nombre de rama (ABC-123) como footer.
 * - Hace fallback a .git/COMMIT_EDITMSG si $1 no llega. Omite commits de merge.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");
const source = (process.argv[3] || "").toLowerCase();
if (source === "merge") process.exit(0);

// ---------------- Helpers ----------------
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

// Scope desde rama (slug tras el "/")
function inferScopeFromBranch(branchRaw) {
  const b = (branchRaw || "").toLowerCase();
  if (!b.includes("/")) return "";
  const slug = (b.split("/")[1] || "")
    .replace(/^bug[_/-]/, "")
    .replace(/^feat(ure)?[_/-]/, "")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "";
}

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
const allowedCanon = new Set(allowedTypes.map((t) => canon(t)));

function validHeader(line) {
  const types = Array.from(allowedCanon).join("|");
  return new RegExp(`^(${types})(\\([\\w./-]+\\))?:\\s?.+`, "i").test(line);
}

// Solo tratamos el primer token como TYPE si está en minúsculas y es permitido
function isLikelyTypeToken(tok) {
  if (!tok) return false;
  if (tok !== tok.toLowerCase()) return false; // evita ALL CAPS o Capitalized
  return allowedCanon.has(canon(tok));
}

// "type scope? subject" -> "type(scope)?: subject" (solo si el type es claro)
function autofixHeader(line) {
  // Casos: "feat(scope) algo" -> "feat(scope): algo" | "feat algo" -> "feat: algo"
  const m = line.match(/^(\w+)(\([^)]+\))?\s+(.*)$/);
  if (m) {
    const raw = m[1];
    const scope = m[2] || "";
    const rest = (m[3] || "").trim();
    if (isLikelyTypeToken(raw)) {
      return `${canon(raw)}${scope}: ${rest}`;
    }
  }
  return line; // no tocar si no es claramente un tipo
}

// Extrae subject del header "type(scope)?: subject"
function getHeaderSubject(line) {
  const m = String(line || "").match(/^[^:]+:\s*(.*)$/);
  return m && m[1] ? m[1].trim() : "";
}

// Si el subject del header está TODO en mayúsculas, bájalo a minúsculas
function decapAllCapsSubject(header) {
  const m = String(header || "").match(/^([^:]+:\s*)(.+)$/);
  if (!m) return header;
  const prefix = m[1];
  const subject = m[2];

  const letters = subject.replace(/[^A-Za-zÁÉÍÓÚÜÑ]/g, "");
  if (letters && letters === letters.toUpperCase()) {
    return prefix + subject.toLowerCase();
  }
  return header;
}

// ---------------- Proceso ----------------
const original = fs.readFileSync(msgFile, "utf8");
const lines = original.split(/\r?\n/);

const BRANCH = getBranch();
const EFFECTIVE_TYPE = inferTypeFromBranch(BRANCH);
const SCOPE = inferScopeFromBranch(BRANCH);

// 1) Header
let firstIdx = lines.findIndex(
  (l) => l.trim() !== "" && !l.trim().startsWith("#"),
);
if (firstIdx === -1) {
  const head = SCOPE ? `${EFFECTIVE_TYPE}(${SCOPE}):` : `${EFFECTIVE_TYPE}:`;
  lines.unshift(head); // sin espacio si no hay subject
  firstIdx = 0;
} else {
  let first = autofixHeader(lines[firstIdx]);
  if (!validHeader(first)) {
    const m = first.match(/^(\w+)(\([^)]+\))?:\s*(.*)$/);
    if (m) {
      const t = canon(m[1]);
      const givenScope = m[2] || "";
      const rest = (m[3] || "").trim();
      if (allowedCanon.has(t)) {
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
  first = first.replace(/\s+$/, ""); // sin espacio de cola (header-trim)
  first = decapAllCapsSubject(first); // normaliza SUBJECT si venía TODO en MAYÚSCULAS
  lines[firstIdx] = first;
}

// 2) Cuerpo: mover body de Desktop si existe; si no hay body usar subject como Descripción
const DESC_RE = /^\s*Descripci(?:ó|o)n:\s*$/i; // soporta con/sin acento
const hasDescripcion = lines.some((l) => DESC_RE.test(l.trim()));
const hasCorregido = lines.some((l) => /^Corregido:\s*$/i.test(l.trim()));
const hasItemsMark = lines.some((l) => /ITEMS_AUTO/.test(l));

if (!hasDescripcion) {
  const ticket = detectTicket(BRANCH);

  // Captura body actual después del header (VS Code/CLI/Desktop)
  const tail = lines.slice(firstIdx + 1);
  const bodyUserLines = [];
  for (const l of tail) {
    const t = l.trim();
    if (t.startsWith("#")) continue; // ignora comentarios
    if (
      DESC_RE.test(t) ||
      /^Corregido:\s*$/i.test(t) ||
      /^Refs:\s*/i.test(t) ||
      /ITEMS_AUTO/.test(t)
    )
      break;
    bodyUserLines.push(l);
  }

  // Limpia resto para reinyectar estructura
  lines.splice(firstIdx + 1);

  const headerSubject = getHeaderSubject(lines[firstIdx]);
  const firstBodyIdx = bodyUserLines.findIndex((l) => l.trim().length > 0);

  const descFirst =
    firstBodyIdx >= 0
      ? bodyUserLines[firstBodyIdx].trim()
      : headerSubject || "[Reemplaza el texto aqui]";

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
  if (!hasCorregido) {
    const refsIdx = lines.findIndex((l) => /^Refs:/i.test(l.trim()));
    const block = ["", "Corregido:", "[Reemplaza el texto aqui]", ""];
    if (refsIdx !== -1) lines.splice(refsIdx, 0, ...block);
    else lines.push(...block);
  }
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
