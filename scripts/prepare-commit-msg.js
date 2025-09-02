#!/usr/bin/env node
/**
 * prepare-commit-msg
 * - VS Code / CLI / GitHub Desktop.
 * - Type por rama:
 *   · bug/*, hotfix/*, fix/*           -> fix
 *   · feature/*, feat/*                -> feat
 *   · feature/bug_* (en el path)       -> fix (prioridad)
 *   · dev, qa, main                    -> chore
 * - Scope automático desde rama (slug tras el "/").
 * - No convierte subjects en MAYÚSCULAS a type; solo si el token está en minúsculas.
 * - Si el subject del header está TODO en MAYÚSCULAS, lo pasa a minúsculas SOLO en el header.
 * - GitHub Desktop:
 *   · Título mínimo 5 chars: si no, se genera uno objetivo desde staged.
 *   · Si no hay body, autodescripción objetiva (≥20) desde staged.
 * - VS Code:
 *   · Descripción obligatoria por el usuario. Se agrega un resumen automático comentado (#) de referencia.
 * - Inserta "Descripción:" (línea siguiente), "Corregido:" (opcional), "# ITEMS_AUTO" y "Refs:".
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");
const source = (process.argv[3] || "").toLowerCase(); // "message" cuando usan -m (p.ej. GitHub Desktop)
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

// Scope desde la rama (slug tras el "/")
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

// Si el subject del header está TODO en mayúsculas, bájalo a minúsculas (solo header)
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

// ---- Resúmenes desde staged ----
function getNameStatus() {
  const out = run("git diff --cached --name-status -M");
  return out ? out.split(/\r?\n/).filter(Boolean) : [];
}
function classifyFiles() {
  const rows = getNameStatus();
  const stat = { A: [], M: [], D: [], R: [] };
  for (const r of rows) {
    // Formatos: "A\tpath", "M\tpath", "D\tpath", "R100\told\tnew"
    const parts = r.split("\t");
    const tag = parts[0];
    if (tag.startsWith("R")) {
      stat.R.push({ old: parts[1], n: parts[2] });
    } else if (tag === "A") stat.A.push(parts[1]);
    else if (tag === "M") stat.M.push(parts[1]);
    else if (tag === "D") stat.D.push(parts[1]);
  }
  return stat;
}
function kindOf(f) {
  if (/\.md$/i.test(f)) return "documentación";
  if (/\.(ya?ml|json)$/i.test(f)) return "configuración";
  if (/\.(ts|js|tsx|jsx|mjs|cjs)$/i.test(f)) return "código";
  if (/\.(css|scss|sass|html)$/i.test(f)) return "estilos";
  return "archivos";
}

// Subject corto objetivo (para Desktop si el título < 5)
function autoSubjectFromStaged() {
  const s = classifyFiles();
  if (s.A.length === 1 && !s.M.length && !s.D.length && !s.R.length) {
    const f = s.A[0];
    return `agrega ${f}`;
  }
  if (s.D.length === 1 && !s.A.length && !s.M.length && !s.R.length) {
    const f = s.D[0];
    return `elimina ${f}`;
  }
  if (s.R.length === 1 && !s.A.length && !s.M.length && !s.D.length) {
    const r = s.R[0];
    return `renombra ${r.old} → ${r.n}`;
  }
  // Por defecto, "actualiza" + conteo
  const total = s.A.length + s.M.length + s.D.length + s.R.length;
  if (total > 0)
    return total === 1 ? "actualiza 1 archivo" : `actualiza ${total} archivos`;
  // fallback
  return "actualiza archivos";
}

// Descripción mínima objetiva (≥ 20)
function autoDescriptionFromStaged() {
  const s = classifyFiles();
  const items = [];
  if (s.A.length)
    items.push(
      `agrega ${s.A.length} archivo(s): ${s.A.slice(0, 2).join(", ")}${s.A.length > 2 ? "…" : ""}`,
    );
  if (s.M.length)
    items.push(
      `actualiza ${s.M.length} archivo(s): ${s.M.slice(0, 2).join(", ")}${s.M.length > 2 ? "…" : ""}`,
    );
  if (s.D.length)
    items.push(
      `elimina ${s.D.length} archivo(s): ${s.D.slice(0, 2).join(", ")}${s.D.length > 2 ? "…" : ""}`,
    );
  if (s.R.length) {
    const sample = s.R.slice(0, 2)
      .map((r) => `${r.old}→${r.n}`)
      .join(", ");
    items.push(
      `renombra ${s.R.length} archivo(s): ${sample}${s.R.length > 2 ? "…" : ""}`,
    );
  }
  const line = items.join("; ");
  return line || "Actualización menor de archivos en el repositorio.";
}

// ---------------- Proceso ----------------
const original = fs.readFileSync(msgFile, "utf8");
const lines = original.split(/\r?\n/);

const BRANCH = getBranch();
const EFFECTIVE_TYPE = inferTypeFromBranch(BRANCH);
const SCOPE = inferScopeFromBranch(BRANCH);
const isDesktop = source === "message"; // Desktop usa -m

// 1) Header
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
  first = first.replace(/\s+$/, "");
  first = decapAllCapsSubject(first);
  lines[firstIdx] = first;
}

// 1.b) Reglas específicas Desktop: mínimo 5 chars de SUBJECT
if (isDesktop) {
  let subj = getHeaderSubject(lines[firstIdx]);
  if (subj.length < 5) {
    const autoSubj = autoSubjectFromStaged();
    // reconstruye header manteniendo type/scope actuales
    const m = lines[firstIdx].match(/^([^:]+:\s*)(.*)$/);
    if (m) lines[firstIdx] = m[1] + autoSubj;
  }
}

// 2) Cuerpo: mover body de Desktop; si no hay body, usar subject o autodescripción
const DESC_RE = /^\s*Descripci(?:ó|o)n:\s*$/i;
const hasDescripcion = lines.some((l) => DESC_RE.test(l.trim()));
const hasCorregido = lines.some((l) => /^Corregido:\s*$/i.test(l.trim()));
const hasItemsMark = lines.some((l) => /ITEMS_AUTO/.test(l));

if (!hasDescripcion) {
  const ticket = detectTicket(BRANCH);

  // Body actual después del header (VS Code/CLI/Desktop)
  const tail = lines.slice(firstIdx + 1);
  const bodyUserLines = [];
  for (const l of tail) {
    const t = l.trim();
    if (t.startsWith("#")) continue;
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

  // Determina primera línea de Descripción
  const headerSubject = getHeaderSubject(lines[firstIdx]);
  const firstBodyIdx = bodyUserLines.findIndex((l) => l.trim().length > 0);

  let descFirst;
  let descRest = [];

  if (isDesktop) {
    // Desktop: si no hay body, autodescripción objetiva
    if (firstBodyIdx >= 0) {
      descFirst = bodyUserLines[firstBodyIdx].trim();
      descRest = bodyUserLines.slice(firstBodyIdx + 1);
    } else {
      descFirst = autoDescriptionFromStaged(); // garantiza ≥ ~20
    }
  } else {
    // VS Code/editor: estricto → usuario debe escribir
    if (firstBodyIdx >= 0) {
      descFirst = bodyUserLines[firstBodyIdx].trim();
      descRest = bodyUserLines.slice(firstBodyIdx + 1);
    } else {
      descFirst = headerSubject || "[Reemplaza el texto aqui]";
      // Agrega una referencia comentada con el resumen (no cuenta para el guard)
      const ref = autoDescriptionFromStaged();
      descRest.push("");
      descRest.push(`# Referencia (no se incluye en validación): ${ref}`);
    }
  }

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
    `Refs: ${detectTicket(BRANCH) || BRANCH}`,
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
