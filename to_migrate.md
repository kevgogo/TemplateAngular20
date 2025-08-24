# to_migrate.md — Pendientes de migración
_Generado: 2025-08-16 06:14_

## Origen (Template_Colibri_Migrar)
- Archivos: TS=74 • HTML=15 • SCSS/CSS=15
- Paquetes Angular detectados: {}
- RxJS: N/D • TypeScript: N/D • Sass: N/D
- Bootstrap: N/D • ngx-bootstrap: N/D • DevExtreme: {}

## Migrado (TemplateAngular20)
- Archivos: TS=43 • HTML=10 • SCSS/CSS=11
- Paquetes Angular detectados: {"@angular/common": "^20.1.0", "@angular/compiler": "^20.1.0", "@angular/core": "^20.1.0", "@angular/forms": "^20.1.0", "@angular/platform-browser": "^20.1.0", "@angular/router": "^20.1.0", "@angular/build": "^20.1.5", "@angular/cli": "^20.1.5", "@angular/compiler-cli": "^20.1.0"}
- RxJS: ^7.8.1 • TypeScript: ~5.8.2 • Sass: N/D
- Bootstrap: ^5.3.3 • ngx-bootstrap: ^20.0.0 • DevExtreme: {'devextreme': '^24.1.5', 'devextreme-angular': '^24.1.5'}

## Checklist de migración (Angular 20 Standalone)
- [x] **Eliminar NgModules** restantes y migrar a standalone (componentes/rutas):
- (n/a)
- [x] Reemplazar `RouterModule.forRoot/forChild` por **provideRouter** en `main.ts` y rutas standalone.
  Usos de RouterModule:
- (n/a)
  `provideRouter(...)` detectado en:
- `src/app/app.config.ts` :L30 → `provideRouter(`
- [x] Cambiar `HttpClientModule` por **provideHttpClient(withInterceptorsFromDi())** en `main.ts`.
  Importaciones de HttpClientModule:
- (n/a)
  provideHttpClient detectado en:
- `src/app/app.config.ts` :L38 → `provideHttpClient(withFetch(), withInterceptors([authInterceptor])),`
- [x] Proveer formularios con `importProvidersFrom(FormsModule, ReactiveFormsModule)` o imports por componente standalone.
  Usos de Forms/ReactiveForms:
- `src/app/layout/sidebar/sidebar.component.ts` :L13 → `import { FormsModule } from '@angular/forms';`
- `src/app/pages/elements/basic-elements.page.ts` :L2 → `import { FormsModule } from '@angular/forms';`
  importProvidersFrom detectado en:
- `src/app/shared/app-third-party.providers.ts` :L19 → `importProvidersFrom(`
- [x] Migrar `BrowserAnimationsModule` a **provideAnimations()** (o `provideNoopAnimations()`).
  Usos de BrowserAnimationsModule:
- (n/a)
  provideAnimations detectado en:
- `src/app/app.config.ts` :L40 → `provideAnimations(),`
- [ ] Reemplazar `@import` por `@use`/`@forward` en SCSS (Dart Sass 3).
- `src/styles.scss` :L2 → `@import url("./assets/css/themes.css");`
- [ ] Reemplazar `toPromise()` y rutas `rxjs/*` legacy por `firstValueFrom/lastValueFrom` y imports desde `rxjs` raíz.
  Imports legacy de RxJS detectados en:
- `src/app/layout/breadcrumbs/breadcrumbs.component.ts` :L15 → `import { filter } from 'rxjs/operators';`
- [x] Eliminar dependencias de **jQuery** y atributos `data-*` de Bootstrap 3; sustituir por componentes Angular/ngx-bootstrap.
  Usos de jQuery:
- (n/a)
  Atributos data-* (Bootstrap):
- (n/a)
- [ ] Remplazar clases de **Bootstrap 3** (panel, col-xs-*, btn-default, glyphicons) por equivalentes de **Bootstrap 5**.
  Clases Bootstrap 3 detectadas en:
- `src/styles/theme.scss` :L9 → `.btn-default{ @extend .btn-secondary; }`
  Glyphicons detectados en:
- (n/a)
- [ ] Quitar dependencias de **BeyondAdmin** y portar estilos a SCSS propio/ngx-bootstrap/DevExtreme.
- `src/styles/theme.scss` :L4 → `// BS3 → BS5 minimal bridge for BeyondAdmin`
- [x] Limpiar `angular.json` → `scripts` que incluyan jQuery/Bootstrap JS (no se usan en NG20 con ngx-bootstrap).
  styles actuales:
  - node_modules/bootstrap/dist/css/bootstrap.min.css
  - node_modules/bootstrap-icons/font/bootstrap-icons.css
  - node_modules/ngx-toastr/toastr.css
  - node_modules/devextreme/dist/css/dx.light.css
  - src/assets/css/themes.css
  - src/styles.scss
- [ ] Reemplazar `*.forRoot()` de ngx-bootstrap por providers standalone cuando aplique.
- `src/app/shared/app-third-party.providers.ts` :L20 → `BsDropdownModule.forRoot(),`
- [x] `app.routes.ts` detectado.
  Archivo(s) de rutas:
  - `src/app/app.routes.ts`
- [x] `main.ts` usa `bootstrapApplication(...)`.

## DevExtreme — verificación
- Revisar que todos los componentes se importen en `imports: []` de cada componente standalone, no vía módulos globales.
  Importaciones `devextreme-angular` detectadas en:
- (n/a)

## ngx-bootstrap — verificación
- Confirmar provisión con `provideBsDropdownConfig`, `provideCollapseConfig`, etc., sólo si se usan. Preferir APIs sin .forRoot.

## Posibles fuentes de error (heurístico)
- HTML con clases/atributos de Bootstrap 3 y jQuery: rompe estilos y toggles en Bootstrap 5/ngx-bootstrap.
- `@import` de Sass: Dart Sass ≥3 lo elimina; generará errores de compilación.
- `toPromise()` y `rxjs/*` legacy: rompe en RxJS modernas.

## Snippets mínimos de refactor
**main.ts (ejemplo base)**
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    // importProvidersFrom(FormsModule, ReactiveFormsModule)
  ]
});
```

**SCSS: migrar @import**
```scss
// Antes
// @import 'variables';
// Después
@use 'variables' as *;
```

**RxJS: toPromise → firstValueFrom**
```ts
import { firstValueFrom } from 'rxjs';
const data = await firstValueFrom(this.http.get('/api'));
```
