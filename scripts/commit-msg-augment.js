/**
 * commit-msg-augment
 * Inserta la sección "Items:" con Agregado/Cambiado/Eliminado/Renombrado
 * justo después del bloque "Corregido:" y antes de "Refs:" (si existe).
 * Si encuentra un marcador, lo reemplaza (soporta: <!-- ITEMS_AUTO --> y "# ITEMS_AUTO").
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const msgFile =
  process.argv[2] || path.join(process.cwd(), ".git/COMMIT_EDITMSG");

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readStaged() {
  const raw = run("git diff --cached --name-status -z");
  if (!raw) return { added: [], changed: [], deleted: [], renamed: [] };
  const t = raw.split("\0").filter(Boolean);
  const added = [],
    changed = [],
    deleted = [],
    renamed = [];
  for (let i = 0; i < t.length; ) {
    const status = t[i++]; // e.g. "A", "M", "D", "R100"
    const code = status[0];
    if (code === "A" || code === "C") {
      const p = t[i++];
      added.push(p);
    } else if (code === "M" || code === "T" || code === "U") {
      const p = t[i++];
      changed.push(p);
    } else if (code === "D") {
      const p = t[i++];
      deleted.push(p);
    } else if (code === "R") {
      const oldP = t[i++],
        newP = t[i++];
      renamed.push([oldP, newP]);
      changed.push(newP);
    } else {
      if (i < t.length) i++; // fallback
    }
  }
  return { added, changed, deleted, renamed };
}

function fmt(label, arr, map = (s) => s) {
  if (!arr || !arr.length) return [];
  const MAX = 30;
  const chunk = arr.slice(0, MAX);
  const out = [`- ${label}:`];
  for (const x of chunk) out.push(`  - ${map(x)}`);
  if (arr.length > MAX) out.push(`  - … y ${arr.length - MAX} más`);
  return out;
}

function buildItems() {
  const { added, changed, deleted, renamed } = readStaged();
  const lines = ["Items:"];
  lines.push(...fmt("Agregado", added));
  lines.push(...fmt("Cambiado", changed));
  lines.push(...fmt("Eliminado", deleted));
  if (renamed.length) {
    lines.push("- Renombrado:");
    for (const [o, n] of renamed) lines.push(`  - ${o} → ${n}`);
  }
  return lines;
}

function isComment(l) {
  const t = l.trim();
  return (
    t.startsWith("#") ||
    t.startsWith("//") ||
    t.startsWith("<!--") ||
    t.startsWith("-->")
  );
}
function removeEmptyCorregido(lines) {
  const i = lines.findIndex((l) => /^Corregido:/i.test(l.trim()));
  if (i === -1) return lines;

  // bloque hasta el siguiente encabezado típico
  let j = i + 1;
  const block = [];
  for (; j < lines.length; j++) {
    const s = lines[j].trim();
    if (!s) {
      block.push(lines[j]);
      continue;
    }
    if (
      /^Refs:/i.test(s) ||
      /^Items:/i.test(s) ||
      /^[A-ZÁÉÍÓÚÑ][\w\s()\/.-]+:\s*$/i.test(s)
    )
      break;
    block.push(lines[j]);
  }

  const content = block
    .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isPlaceholder =
    !content ||
    /describe.*soluci[oó]n aplicada/.test(content) ||
    /reemplaza/.test(content) ||
    /\bno aplica\b/.test(content);

  if (isPlaceholder) {
    lines.splice(i, block.length + 1); // quita "Corregido:" + su bloque
  }
  return lines;
}

const raw = fs.readFileSync(msgFile, "utf8");
let lines = raw.split(/\r?\n/);
lines = removeEmptyCorregido(lines);

// 1) Construir bloque Items (si no hay nada staged, igual lo insertamos vacío)
const items = buildItems();
const itemsBlock = items.length
  ? items
  : ["Items:", "- Agregado:", "- Cambiado:", "- Eliminado:"];

// 2) Buscar marcador o posición de inserción
const placeholderIdx = lines.findIndex(
  (l) => /ITEMS_AUTO/.test(l) || /^#\s*Items.*autogenerar/i.test(l.trim()),
);
let insertIdx = -1;

// Si hay marcador, reemplazarlo
if (placeholderIdx !== -1) {
  lines.splice(placeholderIdx, 1, ...itemsBlock, "");
} else {
  // Buscar "Corregido:" real (no comentado)
  const corregidoIdx = lines.findIndex(
    (l) => !isComment(l) && /^Corregido:/i.test(l.trim()),
  );
  // Buscar "Refs:" real para acotar
  const refsIdx = lines.findIndex(
    (l) => !isComment(l) && /^Refs:/i.test(l.trim()),
  );

  if (corregidoIdx !== -1) {
    // Insertar después del bloque Corregido: (salta líneas siguientes con guiones)
    let j = corregidoIdx + 1;
    while (
      j < lines.length &&
      (isComment(lines[j]) ||
        /^\s*-\s/.test(lines[j]) ||
        lines[j].trim() === "")
    )
      j++;
    insertIdx = j;
  } else if (refsIdx !== -1) {
    insertIdx = refsIdx;
  } else {
    insertIdx = lines.length;
  }

  // Evitar duplicar si ya hay "Items:" no comentado
  const existingItems = lines.findIndex(
    (l) => !isComment(l) && /^Items:/i.test(l.trim()),
  );
  if (existingItems !== -1) {
    // Reemplazar bloque existente hasta Refs o salto grande
    const end =
      refsIdx !== -1 && refsIdx > existingItems ? refsIdx : lines.length;
    lines.splice(existingItems, end - existingItems, ...itemsBlock, "");
  } else {
    lines.splice(insertIdx, 0, ...itemsBlock, "");
  }
}

// Guardar
fs.writeFileSync(msgFile, lines.join("\n"), "utf8");
