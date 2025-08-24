# TODO de Migración — Consolidado

_Generado automáticamente: 2025-08-16 06:11_

## Resumen de estado

### Origen (Template_Colibri_Migrar)

```
Proyecto: Template_Colibri_Migrar
- Archivos TS/HTML/SCSS: 74/15/15
- Angular packages: {'@angular/animations': '^15.0.0', '@angular/common': '^15.0.0', '@angular/compiler': '^15.0.0', '@angular/core': '^15.0.0', '@angular/forms': '^15.0.0', '@angular/platform-browser': '^15.0.0', '@angular/platform-browser-dynamic': '^15.0.0', '@angular/router': '^15.0.0', '@angular/cli': '~15.0.0', '@angular/compiler-cli': '^15.0.0'}
- RxJS: ~7.5.0  • TypeScript: ~4.8.4  • Sass: N/D
- Bootstrap: N/D  • ngx-bootstrap: ^6.2.0  • DevExtreme: {'devextreme': '22.1.6', 'devextreme-angular': '22.1.6'}
- Standalone components: 0
- NgModules detectados: 18
- @import en SCSS: 1
- Uso de jQuery: 1
- Trazas Bootstrap 3: 6
- Glyphicons: 3
- BeyondAdmin: 0
- DevExtreme imports: 6  • ngx-bootstrap imports: 7
- RouterModule.forRoot/forChild: 9
- RxJS legacy (toPromise/patch): 1
```

### Migrado (TemplateAngular20)

```
Proyecto: TemplateAngular20
- Archivos TS/HTML/SCSS: 43/10/11
- Angular packages: {'@angular/common': '^20.1.0', '@angular/compiler': '^20.1.0', '@angular/core': '^20.1.0', '@angular/forms': '^20.1.0', '@angular/platform-browser': '^20.1.0', '@angular/router': '^20.1.0', '@angular/build': '^20.1.5', '@angular/cli': '^20.1.5', '@angular/compiler-cli': '^20.1.0'}
- RxJS: ^7.8.1  • TypeScript: ~5.8.2  • Sass: N/D
- Bootstrap: ^5.3.3  • ngx-bootstrap: ^20.0.0  • DevExtreme: {'devextreme': '^24.1.5', 'devextreme-angular': '^24.1.5'}
- Standalone components: 13
- NgModules detectados: 0
- @import en SCSS: 1
- Uso de jQuery: 0
- Trazas Bootstrap 3: 1
- Glyphicons: 0
- BeyondAdmin: 1
- DevExtreme imports: 2  • ngx-bootstrap imports: 5
- RouterModule.forRoot/forChild: 0
- RxJS legacy (toPromise/patch): 0
```

## Pendientes clave para Angular 20 (Standalone)

- [x] No se detectaron NgModules en el proyecto migrado.

- [ ] Confirmar provisión de formularios (`importProvidersFrom(FormsModule, ReactiveFormsModule)` o imports por componente):
- src/app/layout/sidebar/sidebar.component.ts
- src/app/pages/elements/basic-elements.page.ts

- [ ] Migrar `@import` de Sass a `@use`/`@forward` (Dart Sass 3):
- src/styles.scss

## Bootstrap/Plantilla

- [ ] Reemplazar clases **Bootstrap 3** por equivalentes de **Bootstrap 5** (`panel-*`→`card`, `glyphicon-*`→`bi-*` o FontAwesome, `col-xs-*`→`col-*`).
- [ ] Eliminar dependencias de **jQuery** y JS de Bootstrap 3. Usar APIs de Angular/ngx-bootstrap para toggles, modales, dropdowns, tooltips.
- [ ] Desacoplar recursos de **BeyondAdmin** (CSS/JS) y portarlos a SCSS propio o componentes de ngx-bootstrap/DevExtreme.

## Librerías y versiones a validar

### Origen

- @angular/core: ^15.0.0
- @angular/router: ^15.0.0
- rxjs: ~7.5.0
- typescript: ~4.8.4
- bootstrap: N/D
- ngx-bootstrap: ^6.2.0
- devextreme: 22.1.6
- devextreme-angular: 22.1.6
- sass: N/D

### Migrado

- @angular/core: ^20.1.0
- @angular/router: ^20.1.0
- rxjs: ^7.8.1
- typescript: ~5.8.2
- bootstrap: ^5.3.3
- ngx-bootstrap: ^20.0.0
- devextreme: ^24.1.5
- devextreme-angular: ^24.1.5
- sass: N/D

## Archivos a intervenir (proyecto migrado)

### NgModules

- (n/a)

### RouterModule

- (n/a)

### Form Modules

- src/app/layout/sidebar/sidebar.component.ts
- src/app/pages/elements/basic-elements.page.ts

### HTTP Modules

- (n/a)

### Sass @import

- src/styles.scss

### RxJS legacy

- (n/a)

### jQuery

- (n/a)

### Bootstrap 3 traces

- src/styles/theme.scss

### BeyondAdmin

- src/styles/theme.scss

### DevExtreme imports

- src/app/pages/dashboard/dashboard.page.ts
- src/app/pages/elements/basic-elements.page.ts

### ngx-bootstrap imports

- src/app/core/services/common.service.ts
- src/app/layout/navbar/navbar.component.ts
- src/app/pages/elements/basic-elements.page.ts
- src/app/shared/app-shared-imports.ts
- src/app/shared/app-third-party.providers.ts

## Snippets de migración útiles

```ts
// main.ts — setup standalone
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideClientHydration(),
    // importProvidersFrom(BrowserAnimationsModule, FormsModule, ReactiveFormsModule)
  ],
});
```

```scss
// Reemplazar @import por @use
// Antes:
// @import 'variables';
// @import 'mixins';
// Después:
@use 'variables' as *;
@use 'mixins' as *;
```

```ts
// RxJS modernización
import { firstValueFrom } from 'rxjs';
const data = await firstValueFrom(this.http.get('/api'));
```
