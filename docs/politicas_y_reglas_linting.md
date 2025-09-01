# Guía de Linting para Angular 20

**Política • Alcance • Configuración • Operación**
Versión: 1.0 — 01/09/2025 — Autor: Kevín

---

## 0) Resumen ejecutivo

Esta guía define **cómo linteamos** el código de la plantilla Angular 20 para garantizar calidad, consistencia y performance. El estándar se basa en **ESLint 9 (Flat Config)**, **@angular-eslint 20.x** y **typescript-eslint 8.x**. Se establecen **niveles de severidad**, **catálogo de reglas** (TS y Templates), **configuración base**, **flujo de adopción** y **ejemplos de integración** (VS Code, pre‑commit y CI).

---

## 1) Alcance

- **Incluye:** Código TypeScript (aplicación, librerías internas), templates HTML, pruebas unitarias (`*.spec.ts`).
- **No incluye:** Código de terceros, archivos generados (`dist`, `coverage`), assets estáticos.

---

## 2) Principios

1. **Prevenir errores en runtime** con reglas apoyadas en el _type checker_.
2. **Alinear con Angular moderno:** standalone components, signals y control flow (`@if/@for/@switch`).
3. **Accesibilidad progresiva:** empezar en `warn`, elevar a `error` por módulo/producto.
4. **Bajo ruido:** el formateo lo maneja Prettier; ESLint se enfoca en **calidad y seguridad**.

---

## 3) Stack y versiones

- Node ≥ 18.18 (recomendado Node 22).
- **ESLint 9** (Flat Config).
- **@angular-eslint 20.x** (plugins TS + Template + presets).
- **@typescript-eslint 8.x** (parser + reglas con tipos).
- **Prettier** (formateo) + **Husky**/**lint-staged** (pre‑commit).

---

## 4) Niveles de severidad

- **Error (MUST):** bloquea el build/PR.
- **Warn (SHOULD):** recomendado; se eleva a `error` gradualmente.
- **Off (OPTIONAL):** desactivado salvo excepción local.

---

## 5) Presets activados

- `@eslint/js` → `recommended`
- `@typescript-eslint` → `recommended-type-checked`
- `@angular-eslint` → `tsRecommended`, `templateRecommended`, `templateAccessibility`

> Con estos presets muchas reglas vienen listas. Abajo definimos el **mínimo obligatorio** y la **config por defecto**.

---

## 6) Catálogo — Reglas **TypeScript** (TS)

### 6.1 Obligatorias (Error)

**Seguridad de tipos**

- `@typescript-eslint/no-floating-promises`
- `@typescript-eslint/no-misused-promises`
- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-argument`

**Angular esenciales**

- `@angular-eslint/component-selector`, `directive-selector`
- `@angular-eslint/no-output-rename`, `no-output-on-prefix`, `no-outputs-metadata-property`
- `@angular-eslint/no-queries-metadata-property`, `no-inputs-metadata-property`
- `@angular-eslint/no-attribute-decorator`, `no-conflicting-lifecycle`

### 6.2 Recomendadas (Warn, subir a Error por etapa)

- `@angular-eslint/prefer-standalone` — standalone components
- `@angular-eslint/prefer-inject` — `inject()`
- `@angular-eslint/prefer-on-push-component-change-detection`
- `@angular-eslint/prefer-output-readonly`, `prefer-output-emitter-ref`
- `@typescript-eslint/no-explicit-any` (preferir `unknown`)

### 6.3 Opcionales / según contexto

- `component-class-suffix`, `directive-class-suffix`
- `no-forward-ref`, `no-pipe-impure`
- `consistent-component-styles`, `sort-keys-in-type-decorator`
- `use-component-view-encapsulation`, `use-injectable-provided-in`
- `prefer-signals`, `relative-url-prefix`, `require-localize-metadata`

---

## 7) Catálogo — Reglas **Templates HTML**

### 7.1 Obligatorias (Error)

- `@angular-eslint/template/prefer-control-flow` — `@if/@for/@switch`
- `@angular-eslint/template/use-track-by-function` — listas con `trackBy`
- `@angular-eslint/template/no-duplicate-attributes`
- `@angular-eslint/template/no-call-expression` — sin ejecutar funciones en el template

### 7.2 Recomendadas (Warn)

- `@angular-eslint/template/eqeqeq`
- `@angular-eslint/template/no-negated-async`
- `@angular-eslint/template/no-interpolation-in-attributes`
- `@angular-eslint/template/no-inline-styles`

### 7.3 Accesibilidad (Warn → Error por módulo)

- `accessibility-alt-text`, `interactive-supports-focus`, `elements-content`, `valid-aria`
- `role-has-required-aria`, `table-scope`, `button-has-type`,
- `label-has-associated-control`, `click-events-have-key-events`,
- `mouse-events-have-key-events`

### 7.4 Otras útiles

- `prefer-ngsrc`, `prefer-template-literal`, `prefer-at-empty`, `prefer-contextual-for-variables`
- `no-empty-control-flow`, `no-nested-tags`, `no-autofocus`, `no-positive-tabindex`
- `attributes-order`, `prefer-self-closing-tags`, `use-track-by-function`

---

## 8) Configuración base (Flat Config)

```js
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", ".angular", ".nx"] },

  // TypeScript
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, ...angular.configs.tsRecommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",

      "@angular-eslint/component-selector": "error",
      "@angular-eslint/directive-selector": "error",
      "@angular-eslint/no-attribute-decorator": "error",
      "@angular-eslint/no-output-rename": "error",
      "@angular-eslint/no-output-on-prefix": "error",
      "@angular-eslint/no-outputs-metadata-property": "error",
      "@angular-eslint/no-queries-metadata-property": "error",

      "@angular-eslint/prefer-on-push-component-change-detection": "warn",
      "@angular-eslint/prefer-standalone": "warn",
      "@angular-eslint/prefer-inject": "warn",
      "@angular-eslint/prefer-output-readonly": "warn",
      "@angular-eslint/prefer-output-emitter-ref": "warn",

      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Templates HTML
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      "@angular-eslint/template/prefer-control-flow": "error",
      "@angular-eslint/template/use-track-by-function": "error",
      "@angular-eslint/template/no-duplicate-attributes": "error",
      "@angular-eslint/template/no-call-expression": "error",

      "@angular-eslint/template/eqeqeq": "warn",
      "@angular-eslint/template/no-negated-async": "warn",
      "@angular-eslint/template/no-interpolation-in-attributes": "warn",
      "@angular-eslint/template/no-inline-styles": "warn",

      "@angular-eslint/template/accessibility-alt-text": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
      "@angular-eslint/template/accessibility-elements-content": "warn",
    },
  },

  // Tests: overrides
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": ["warn", { ignoreVoid: true }],
    },
  },
);
```

---

## 9) Operación — VS Code, scripts y hooks

**VS Code (`.vscode/settings.json`)**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "eslint.useFlatConfig": true,
  "html.format.enable": false
}
```

**Scripts NPM**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.html",
    "lint:fix": "eslint . --ext .ts,.html --fix",
    "lint:watch": "eslint . --ext .ts,.html --cache --watch --max-warnings=0"
  }
}
```

**Pre‑commit (Husky + lint‑staged)**

```json
{
  "lint-staged": {
    "*.{ts,html}": ["eslint --fix", "git add"]
  }
}
```

---

## 10) CI/CD — ejemplos

**Azure Pipelines (`azure-pipelines.yml`)**

```yaml
- script: |
    npm ci
    npm run lint
  displayName: ESLint (Angular 20)
```

**GitHub Actions (`.github/workflows/lint.yml`)**

```yaml
name: lint
on: [push, pull_request]
jobs:
  eslint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm ci
      - run: npm run lint
```

> Política de fallo: los **warnings no fallan** al inicio. Se eleva a `--max-warnings=0` por repositorio/módulo cuando el equipo esté listo.

---

## 11) Excepciones y overrides

- **Tests (`*.spec.ts`)**: permitir `void` en promesas sin await.
- **Código legado**: se puede desactivar `prefer-standalone`/`prefer-inject` por archivo o carpeta con `overrides`.
- **Casos justificados**: usar `// eslint-disable-next-line <regla>  —  motivo` y crear ticket para corregirlo.

---

## 12) Adopción incremental

1. Activar presets + obligatorias (`error`).
2. Ejecutar `lint:fix` y limpiar problemas triviales.
3. Mantener modernización y a11y en `warn` durante la primera iteración.
4. Subir a `error` por módulos conforme cierre de deuda.
5. Supervisar con `eslint --print-config` en archivos representativos.

---

## 13) Troubleshooting

- **“Invalid option” al usar ESLint 9** → confirmar que el comando corresponde a ESLint 9 y que `eslint.useFlatConfig` esté en `true`.
- **Baja performance** → activar `--cache` y excluir `dist`, `coverage`, `.angular`, `.nx`.
- **Conflictos con Prettier** → dejar estética a Prettier y evitar reglas de estilo redundantes en ESLint.
- **Parser de tipos** → usar `parserOptions.projectService: true` para proyectos multi‑tsconfig.

---

## 14) Glosario

- **MUST / SHOULD / OPTIONAL:** niveles de exigencia de la política.
- **Control flow**: sintaxis de Angular (`@if/@for/@switch`) que reemplaza a `*ngIf/*ngFor/*ngSwitch`.
- **Standalone**: componentes sin NgModules; favorece tree‑shaking y simplicidad.

---

## 15) Anexo: listado completo de reglas (referencia)

**TS (`@angular-eslint/eslint-plugin`)**
`contextual-lifecycle`, `no-async-lifecycle-method`, `no-attribute-decorator`, `no-developer-preview`, `no-experimental`, `require-lifecycle-on-prototype`, `sort-lifecycle-methods`, `component-class-suffix`, `component-max-inline-declarations`, `component-selector`, `consistent-component-styles`, `contextual-decorator`, `directive-class-suffix`, `directive-selector`, `no-conflicting-lifecycle`, `no-duplicates-in-metadata-arrays`, `no-empty-lifecycle-method`, `no-forward-ref`, `no-input-prefix`, `no-input-rename`, `no-inputs-metadata-property`, `no-lifecycle-call`, `no-output-native`, `no-output-on-prefix`, `no-output-rename`, `no-outputs-metadata-property`, `no-pipe-impure`, `no-queries-metadata-property`, `no-uncalled-signals`, `pipe-prefix`, `prefer-inject`, `prefer-on-push-component-change-detection`, `prefer-output-emitter-ref`, `prefer-output-readonly`, `prefer-signals`, `prefer-standalone`, `relative-url-prefix`, `require-localize-metadata`, `runtime-localize`, `sort-keys-in-type-decorator`, `use-component-selector`, `use-component-view-encapsulation`, `use-injectable-provided-in`, `use-lifecycle-interface`, `use-pipe-transform-interface`.

**Templates (`@angular-eslint/eslint-plugin-template`)**
`no-duplicate-attributes`, `no-nested-tags`, `alt-text`, `banana-in-box`, `button-has-type`, `click-events-have-key-events`, `conditional-complexity`, `cyclomatic-complexity`, `elements-content`, `eqeqeq`, `i18n`, `interactive-supports-focus`, `label-has-associated-control`, `mouse-events-have-key-events`, `no-any`, `no-autofocus`, `no-call-expression`, `no-distracting-elements`, `no-empty-control-flow`, `no-inline-styles`, `no-interpolation-in-attributes`, `no-negated-async`, `no-positive-tabindex`, `prefer-at-empty`, `prefer-contextual-for-variables`, `prefer-control-flow`, `prefer-ngsrc`, `prefer-template-literal`, `role-has-required-aria`, `table-scope`, `use-track-by-function`, `valid-aria`.

---

**Fin del documento.**
