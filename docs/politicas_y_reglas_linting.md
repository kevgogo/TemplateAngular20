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

## 15) Anexo: reglas con explicación breve

> **Objetivo:** referencia rápida para saber qué hace cada regla y cuándo conviene subirla a `error`.

### 15.1 TypeScript — `@angular-eslint/eslint-plugin`

- **contextual-lifecycle** — Usa _lifecycle hooks_ solo donde aplican (componentes/directivas), no en clases arbitrarias.
- **no-async-lifecycle-method** — Los hooks no deben ser `async`; si necesitas async, llama funciones async _desde_ el hook.
- **no-attribute-decorator** — Evita `@Attribute()` (confunde responsabilidades); prefiere `@Input()` u otras alternativas de DI.
- **no-developer-preview** — No uses APIs marcadas como _developer preview_ (inestables y sujetas a cambio).
- **no-experimental** — Evita APIs experimentales (lo mismo que arriba, pero para marca _experimental_).
- **require-lifecycle-on-prototype** — Declara hooks como **métodos** de clase (en el prototipo), no como campos/arrow functions.
- **sort-lifecycle-methods** — Ordena los hooks de acuerdo con su secuencia de ejecución (consistencia y legibilidad).
- **component-class-suffix** — Las clases de componentes terminan en `Component` (si tu guía lo exige).
- **component-max-inline-declarations** — Limita el tamaño de `template`/`styles` inline para fomentar archivos dedicados.
- **component-selector** — Forza prefijo/estilo de selector (`kebab-case`, `app-…`, etc.) para componentes.
- **consistent-component-styles** — Usa una sola convención (`styles` vs `styleUrl(s)`) y sé consistente.
- **contextual-decorator** — Decoradores de Angular (`@Input`, `@Output`, `@HostListener`, etc.) solo en clases que los soportan.
- **directive-class-suffix** — Las clases de directivas terminan en `Directive` (si tu guía lo exige).
- **directive-selector** — Forza prefijo/estilo de selector de directivas (normalmente atributo en `camelCase`).
- **no-conflicting-lifecycle** — No mezclar hooks que se contradicen o que generan comportamientos inesperados.
- **no-duplicates-in-metadata-arrays** — Evita entradas duplicadas en arrays de metadatos (`imports`, `providers`, `animations`, …).
- **no-empty-lifecycle-method** — Quita hooks vacíos; o implementa su lógica o elimínalos.
- **no-forward-ref** — Evita `forwardRef`; prefiere referencias directas o reestructura para no necesitarlo.
- **no-input-prefix** — No uses prefijos problemáticos en `@Input()` (evita colisiones o semántica confusa).
- **no-input-rename** — No cambies el nombre público del `@Input()` con alias; mantén un único nombre.
- **no-inputs-metadata-property** — No declares `inputs: []` en metadatos; usa `@Input()` en el miembro.
- **no-lifecycle-call** — No invoques hooks manualmente (`ngOnInit()`…); Angular los gestiona.
- **no-output-native** — No declares `@Output()` con nombres de eventos nativos (`click`, `change`, …).
- **no-output-on-prefix** — No inicies nombres de `@Output()` con `on…` (evita confusiones con handlers).
- **no-output-rename** — No cambies el nombre público del `@Output()` con alias; un solo nombre claro.
- **no-outputs-metadata-property** — No declares `outputs: []` en metadatos; usa `@Output()`.
- **no-pipe-impure** — Evita _pipes_ impuros (re-render costoso); prefiere _pure pipes_ o lógica en componentes.
- **no-queries-metadata-property** — No uses `queries` en metadatos; usa decoradores (`@ViewChild`, `@ContentChild`, …).
- **no-uncalled-signals** — No “operes” el _signal_ sin invocarlo/actualizarlo (lee con `sig()`; escribe con `set/update`).
- **pipe-prefix** — Define un prefijo coherente para el nombre de _pipes_ (p. ej., `app…`).
- **prefer-inject** — Prefiere `inject()` en lugar de inyección por constructor cuando aporta claridad/simplicidad.
- **prefer-on-push-component-change-detection** — Usa `ChangeDetectionStrategy.OnPush` para mejorar performance.
- **prefer-output-emitter-ref** — Prefiere `OutputEmitterRef`/`OutputRef` sobre `EventEmitter` en código nuevo.
- **prefer-output-readonly** — Declara los outputs como `readonly` para evitar reasignaciones.
- **prefer-signals** — Prefiere APIs basadas en _signals_ para estado/inputs cuando estén disponibles.
- **prefer-standalone** — Prioriza componentes _standalone_ (menos NgModules, mejor tree‑shaking).
- **relative-url-prefix** — Prefiere rutas relativas con `./` o `../` en URLs de recursos.
- **require-localize-metadata** — Añade metadatos (significado/descripcion) a mensajes con `$localize`.
- **runtime-localize** — Asegura que las cadenas `$localize` están preparadas para traducción en _runtime_.
- **sort-keys-in-type-decorator** — Orden consistente de propiedades dentro de los decoradores (`Component`, `Directive`, …).
- **use-component-selector** — Todo `@Component` debe declarar `selector`.
- **use-component-view-encapsulation** — Evita `ViewEncapsulation.None` o documenta explícitamente su uso.
- **use-injectable-provided-in** — Servicios con `providedIn` para DI _tree‑shakeable_.
- **use-lifecycle-interface** — Si implementas un hook, implementa también su **interfaz** (`OnInit`, `OnDestroy`, …).
- **use-pipe-transform-interface** — Toda clase `@Pipe` implementa `PipeTransform`.

### 15.2 Templates — `@angular-eslint/eslint-plugin-template`

- **no-duplicate-attributes** — No repitas atributos ni _bindings_ en el mismo elemento.
- **no-nested-tags** — Evita anidar `<a>` dentro de `<a>` o `<button>` dentro de `<button>`.
- **alt-text** — Imágenes y equivalentes con texto alternativo adecuado (o `aria-*`).
- **banana-in-box** — Sintaxis correcta de _two‑way binding_: `[()]`.
- **button-has-type** — Todo `<button>` debe declarar `type` (`button`, `submit`, `reset`).
- **click-events-have-key-events** — Elementos con `click` deben responder al teclado (accesibilidad).
- **conditional-complexity** — Limita la complejidad de condiciones en plantillas (legibilidad/mantenibilidad).
- **cyclomatic-complexity** — Controla complejidad ciclomática en expresiones del template.
- **elements-content** — Ciertos elementos deben tener contenido válido (encabezados, enlaces, botones, …).
- **eqeqeq** — Usa `===/!==` en vez de `==/!=` dentro de plantillas.
- **i18n** — Reglas para marcas de internacionalización: faltantes, duplicadas o mal definidas.
- **interactive-supports-focus** — Elementos interactivos deben poder enfocarse.
- **label-has-associated-control** — Cada `<label>` vinculado correctamente a su control.
- **mouse-events-have-key-events** — Si hay eventos de mouse, agrega alternativa de teclado.
- **no-any** — Evita `$any(...)`; pierde verificación de tipos.
- **no-autofocus** — No fuerces foco automático (accesibilidad/usabilidad).
- **no-call-expression** — No ejecutes funciones directamente en el template (impacto en _change detection_).
- **no-distracting-elements** — Evita elementos distractores/obsoletos (`<marquee>`, etc.).
- **no-empty-control-flow** — Bloques `@if/@for/@switch` no deben quedar vacíos.
- **no-inline-styles** — Evita `style="…"` inline; usa clases/estilos externos.
- **no-interpolation-in-attributes** — No interpoles en atributos; usa _property binding_ (`[attr.foo]`).
- **no-negated-async** — No niegues directamente resultados del `async` pipe.
- **no-positive-tabindex** — Evita `tabindex` positivo (rompe el orden natural de tabulación).
- **prefer-at-empty** — Usa `@empty` con `@for` en lugar de `@if` auxiliares para colecciones vacías.
- **prefer-contextual-for-variables** — Usa variables contextuales de `@for` (`index`, `count`, etc.).
- **prefer-control-flow** — Prefiere `@if/@for/@switch` sobre sintaxis `*ngIf/*ngFor/*ngSwitch`.
- **prefer-ngsrc** — Usa `ngSrc` en `<img>` para carga más segura y performante.
- **prefer-template-literal** — Prefiere _template literals_ en expresiones de texto.
- **role-has-required-aria** — Si usas un `role`, incluye los atributos ARIA requeridos.
- **table-scope** — El atributo `scope` solo en `<th>` y correctamente definido.
- **use-track-by-function** — Siempre define `trackBy` en `@for`/`*ngFor` para listas.
- **valid-aria** — Atributos ARIA válidos y con valores correctos.
- **attributes-order** — Ordena atributos y _bindings_ de manera consistente.
- **prefer-self-closing-tags** — Etiquetas autocontenidas cuando no hay contenido.
- **prefer-static-string-properties** — Valores **estáticos** como strings directos (no _bindings_ innecesarios).
