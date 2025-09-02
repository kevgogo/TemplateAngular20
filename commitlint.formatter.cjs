// Formateador avanzado en español para commitlint con mejor UX

// === COLORES Y ESTILOS ===
const colors = {
  reset: "\u001b[0m",
  bright: "\u001b[1m",
  dim: "\u001b[2m",

  // Colores básicos
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",

  // Colores brillantes
  brightRed: "\u001b[91m",
  brightGreen: "\u001b[92m",
  brightYellow: "\u001b[93m",
  brightBlue: "\u001b[94m",
  brightMagenta: "\u001b[95m",
  brightCyan: "\u001b[96m",

  // Backgrounds
  bgRed: "\u001b[41m",
  bgGreen: "\u001b[42m",
  bgYellow: "\u001b[43m",
};

// Helpers de formato
const style = {
  error: (s) => `${colors.brightRed}${s}${colors.reset}`,
  warning: (s) => `${colors.brightYellow}${s}${colors.reset}`,
  success: (s) => `${colors.brightGreen}${s}${colors.reset}`,
  info: (s) => `${colors.brightCyan}${s}${colors.reset}`,
  muted: (s) => `${colors.dim}${s}${colors.reset}`,
  bold: (s) => `${colors.bright}${s}${colors.reset}`,
  code: (s) => `${colors.cyan}${s}${colors.reset}`,
  highlight: (s) => `${colors.bgYellow}${colors.bright}${s}${colors.reset}`,
};

// === MENSAJES MEJORADOS ===
const MESSAGES = {
  // Errores de tipo
  "type-empty": {
    message: "el tipo no puede estar vacío",
    suggestion: "Usa: feat, fix, docs, chore, etc.",
    example: "feat: añadir nueva funcionalidad",
  },
  "type-enum": {
    message: "tipo de commit no válido",
    suggestion:
      "Tipos permitidos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert",
    example: "fix: corregir error en validación",
  },
  "type-case": {
    message: "el tipo debe estar en minúsculas",
    suggestion: "Cambia a minúsculas",
    example: "feat (no FEAT o Feat)",
  },

  // Errores de asunto
  "subject-empty": {
    message: 'el asunto no puede estar vacío después de ":"',
    suggestion: "Describe brevemente qué cambia este commit",
    example: "feat: implementar autenticación JWT",
  },
  "subject-case": {
    message: "el asunto no debe empezar con mayúscula",
    suggestion: "Usa minúscula inicial y estilo imperativo",
    example: "feat: agregar validación (no: Agregar validación)",
  },
  "subject-full-stop": {
    message: "el asunto no debe terminar con punto",
    suggestion: "Elimina el punto final",
    example: "fix: corregir bug en login (no: ...login.)",
  },
  "subject-min-length": {
    message: "el asunto es demasiado corto",
    suggestion: "Describe con más detalle (mín. 10 caracteres)",
    example: "feat: implementar cache Redis",
  },

  // Errores de longitud
  "header-max-length": {
    message: "el encabezado es demasiado largo",
    suggestion: "Mantén el encabezado bajo 100 caracteres",
    example: "feat(auth): implementar JWT",
  },
  "header-min-length": {
    message: "el encabezado es demasiado corto",
    suggestion: "Proporciona más contexto (mín. 15 caracteres)",
    example: "feat: añadir validación de email",
  },

  // Errores de scope
  "scope-empty": {
    message: "el scope no puede estar vacío cuando usas paréntesis",
    suggestion: "Define el scope o elimina los paréntesis",
    example: "feat(auth): ... o feat: ...",
  },
  "scope-case": {
    message: "el scope debe estar en minúsculas",
    suggestion: "Usa kebab-case o camelCase",
    example: "feat(user-auth): ... (no: USER-AUTH)",
  },

  // Errores de estructura
  "body-leading-blank": {
    message: "debe haber una línea en blanco entre encabezado y cuerpo",
    suggestion: "Añade una línea vacía después del encabezado",
    example: "feat: título\n\nDescripción del cuerpo...",
  },
  "footer-leading-blank": {
    message: "debe haber una línea en blanco antes del footer",
    suggestion: "Añade una línea vacía antes del footer",
    example: "...\n\nRefs: #123",
  },
  "body-max-line-length": {
    message: "línea del cuerpo demasiado larga",
    suggestion: "Mantén las líneas bajo 100 caracteres",
    example: "Divide en múltiples líneas",
  },

  // Referencias
  "references-empty": {
    message: "falta referencia a ticket/issue",
    suggestion: "Añade referencia al final",
    example: "Refs: #123, closes #456",
  },
};

// === SUGERENCIAS POR TIPO ===
const TYPE_SUGGESTIONS = {
  feat: "🚀 Nueva funcionalidad para el usuario",
  fix: "🐛 Corrección de un bug",
  docs: "📚 Cambios solo en documentación",
  style: "💎 Cambios de formato, espacios, etc.",
  refactor: "📦 Cambio de código que no añade funcionalidad ni corrige bugs",
  perf: "⚡ Mejora de rendimiento",
  test: "🧪 Añadir o corregir tests",
  build: "🔨 Cambios en sistema de build",
  ci: "⚙️ Cambios en configuración de CI/CD",
  chore: "🛠️ Tareas de mantenimiento",
  revert: "⏪ Revertir commit anterior",
};

// === FUNCIONES AUXILIARES ===
function extractTypeFromInput(input) {
  const match = input.match(/^([a-z]+)(\([^)]+\))?:/);
  return match ? match[1] : null;
}

function getDetailedMessage(rule, originalMessage, data = {}) {
  const ruleInfo = MESSAGES[rule];

  if (!ruleInfo) {
    return {
      message: originalMessage || `regla "${rule}" incumplida`,
      suggestion: "Consulta la documentación de Conventional Commits",
      example: "",
    };
  }

  // Personalizar mensajes con datos específicos
  let { message, suggestion, example } = ruleInfo;

  if (rule === "header-max-length" && data.maxLength && data.headerLength) {
    message = `${message} (${data.headerLength}/${data.maxLength} caracteres)`;
  }

  if (rule === "type-enum" && data.actual) {
    message = `"${data.actual}" no es un tipo válido`;
  }

  return { message, suggestion, example };
}

function formatCommitStructure() {
  return [
    style.bold("📋 Estructura de Conventional Commits:"),
    "",
    style.code("  <tipo>[scope opcional]: <descripción>"),
    style.code("  "),
    style.code("  [cuerpo opcional]"),
    style.code("  "),
    style.code("  [footer(s) opcional(es)]"),
    "",
    style.muted("Ejemplos:"),
    style.success("  ✓ feat(auth): implementar login con JWT"),
    style.success("  ✓ fix: corregir validación de email"),
    style.success("  ✓ docs: actualizar README con nueva API"),
    "",
  ].join("\n");
}

function formatTypeHelp() {
  const lines = [style.bold("🏷️  Tipos de commit disponibles:")];

  Object.entries(TYPE_SUGGESTIONS).forEach(([type, description]) => {
    lines.push(`  ${style.code(type.padEnd(10))} ${style.muted(description)}`);
  });

  return lines.join("\n");
}

// === FORMATEADOR PRINCIPAL ===
/**
 * @param {{errors: Array, warnings: Array, input: string, helpUrl?: string}} report
 */
module.exports = function format(report) {
  const { errors = [], warnings = [], input = "", helpUrl } = report;

  const lines = [];
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  // === HEADER ===
  const headerIcon = hasErrors ? "❌" : hasWarnings ? "⚠️" : "✅";
  const headerColor = hasErrors
    ? style.error
    : hasWarnings
      ? style.warning
      : style.success;

  lines.push("");
  lines.push(headerColor(`${headerIcon} Husky: Revisión de commit`));

  if (input) {
    lines.push("");
    lines.push(`${style.info("📝 Commit:")} ${style.code(input)}`);
  }

  // === ERRORES ===
  if (errors.length > 0) {
    lines.push("");
    lines.push(style.error("🚨 ERRORES ENCONTRADOS:"));
    lines.push("");

    errors.forEach((error, index) => {
      const { message, suggestion, example } = getDetailedMessage(
        error.name || error.rule,
        error.message,
        error,
      );

      lines.push(
        `${style.error(`  ${index + 1}.`)} ${message} ${style.muted(`[${error.name || error.rule}]`)}`,
      );

      if (suggestion) {
        lines.push(`     ${style.info("💡")} ${suggestion}`);
      }

      if (example) {
        lines.push(`     ${style.muted("ejemplo:")} ${style.code(example)}`);
      }

      lines.push("");
    });
  }

  // === WARNINGS ===
  if (warnings.length > 0) {
    lines.push("");
    lines.push(style.warning("⚠️  ADVERTENCIAS:"));
    lines.push("");

    warnings.forEach((warning, index) => {
      const { message, suggestion } = getDetailedMessage(
        warning.name || warning.rule,
        warning.message,
        warning,
      );

      lines.push(
        `${style.warning(`  ${index + 1}.`)} ${message} ${style.muted(`[${warning.name || warning.rule}]`)}`,
      );

      if (suggestion) {
        lines.push(`     ${style.info("💡")} ${suggestion}`);
      }

      lines.push("");
    });
  }

  // === AYUDA CONTEXTUAL ===
  if (hasErrors || hasWarnings) {
    lines.push("");
    lines.push("─".repeat(60));

    // Mostrar estructura si hay errores de formato
    const formatErrors = [...errors, ...warnings].some((item) =>
      ["type-empty", "subject-empty", "header-max-length"].includes(
        item.name || item.rule,
      ),
    );

    if (formatErrors) {
      lines.push("");
      lines.push(formatCommitStructure());
    }

    // Mostrar tipos si hay error de tipo
    const typeErrors = [...errors, ...warnings].some((item) =>
      ["type-enum", "type-empty"].includes(item.name || item.rule),
    );

    if (typeErrors) {
      lines.push("");
      lines.push(formatTypeHelp());
      lines.push("");
    }
  }

  // === RESUMEN ===
  lines.push("");
  lines.push("─".repeat(60));

  const summaryIcon = hasErrors ? "❌" : hasWarnings ? "⚠️" : "✅";
  const summaryText = hasErrors
    ? `${errors.length} error(es), ${warnings.length} advertencia(s) - COMMIT BLOQUEADO`
    : hasWarnings
      ? `${warnings.length} advertencia(s) - commit permitido con warnings`
      : "¡Commit válido!";

  const summaryColor = hasErrors
    ? style.error
    : hasWarnings
      ? style.warning
      : style.success;
  lines.push(summaryColor(`${summaryIcon} ${summaryText}`));

  // === LINKS DE AYUDA ===
  lines.push("");
  const url = helpUrl || "https://www.conventionalcommits.org/es/v1.0.0/";
  lines.push(`${style.info("📖 Más información:")} ${style.code(url)}`);
  lines.push(
    `${style.info("🔧 Configuración:")} ${style.code("commitlint.config.cjs")}`,
  );

  lines.push("");

  return lines.join("\n");
};
