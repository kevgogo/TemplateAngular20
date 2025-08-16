// // src/app/auth/login.component.ts
// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// import { CommonService } from 'src/app/service/common.service';
// import { MenuService } from '../menu/menu.service';
// import { SettingsService } from '../settings/settings.service';
// import { AuthService } from './auth.service';
// import { SHARED_IMPORTS } from '@shared/app-shared-imports';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [SHARED_IMPORTS],
//   providers: [AuthService],
// })
// export class LoginComponent implements OnInit {
//   // Inyección con `inject()` (Angular 15+). Evita constructor y es tree-shakeable.
//   private readonly route = inject(ActivatedRoute);
//   private readonly auth = inject(AuthService);
//   private readonly setting = inject(SettingsService);
//   private readonly menu = inject(MenuService);
//   private readonly rt = inject(Router);
//   private readonly common = inject(CommonService);

//   ngOnInit(): void {
//     const routeParams = this.route.snapshot.queryParamMap;
//     const keyLogin = routeParams.get('keyLogin');

//     if (!keyLogin) {
//       this.common.redirecToUnauthorized({
//         code: '401',
//         error: 'Token',
//         message: 'Token no valido',
//       });
//       return;
//     }

//     this.auth.getUserContext(keyLogin).subscribe({
//       next: (x: any) => {
//         if (x?.typeResult === 1) {
//           const user = x.objectResult?.[0] ?? {};
//           Object.keys(user).forEach((k) =>
//             this.setting.setUserSetting(k, user[k])
//           );
//           this.setting.setUserSetting('token', x.messageResult);
//           this.menu.getMenu();
//           this.menu.getPermission();
//           this.rt.navigate(['']);
//         } else {
//           this.common.redirecToError({
//             code: '404',
//             error: 'Not found',
//             message: 'usuario no encontrado',
//           });
//         }
//       },
//       error: () => {
//         this.common.redirecToError({
//           code: '500',
//           error: 'Server Error',
//           message: 'No fue posible validar el usuario',
//         });
//       },
//     });
//   }
// }
