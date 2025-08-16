import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BsModalService } from 'ngx-bootstrap/modal';
@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public modalRef: any = {
    SuccessModal: null,
    InfoModal: null,
    DangerModal: null,
    WarningModal: null,
  };

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private modalService: BsModalService
  ) {}

  // helpers internos (pueden ir privados dentro de la clase)
  private resolveErrorTarget(code: number): string {
    if (code === 403) return '/error/403';
    if (code === 404) return '/error/404';
    // 0 (network), 503 y cualquier 5xx → 500
    if (code === 0 || code === 503 || (code >= 500 && code < 600))
      return '/error/500';
    // fallback
    return '/error/500';
  }

  private buildErrorState(data?: {
    code?: string | number;
    error?: string;
    message?: string;
  }) {
    const codeNum = Number(data?.code ?? 500);
    return {
      code: String(codeNum || '500'),
      error:
        data?.error ??
        (codeNum === 403
          ? 'Acceso denegado'
          : codeNum === 404
          ? 'Página no encontrada'
          : 'Error del servidor'),
      message: data?.message ?? '',
      from: this.router.url || '/',
      ts: Date.now(),
    };
  }

  getLastErrorState<
    T extends { code?: string; error?: string; message?: string }
  >() {
    return (history.state ?? {}) as T;
  }

  // === Reemplazos ===
  redirecToError(data: { code: string; error: string; message: string }) {
    const codeNum = Number(data?.code ?? 500);
    const target = this.resolveErrorTarget(codeNum);
    const state = this.buildErrorState({ ...data, code: codeNum });
    return this.router.navigateByUrl(target, { state });
  }

  redirecToUnauthorized(data: {
    code: string;
    error: string;
    message: string;
  }) {
    // 401 → a login con returnUrl (ajústalo si prefieres usar una página de error)
    const returnUrl = this.router.url || '/';
    return this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  redirectToNotFound(data: { code: string; error: string; message: string }) {
    const state = this.buildErrorState({ ...data, code: 404 });
    return this.router.navigateByUrl('/error/404', { state });
  }

  showNotification(type: string, message: string, title: string) {
    if (type === 'success') this.toastr.success(message, title);
    else if (type === 'warning') this.toastr.warning(message, title);
    else if (type === 'info') this.toastr.info(message, title);
    else if (type === 'error') this.toastr.error(message, title);
  }
  /** Manejo de elementos de Session */
  obtenerElementoSession(nombre: string) {
    return JSON.parse(localStorage.getItem(nombre) ?? '{}');
  }

  registrarElementoSession(nombre: string, objeto: any) {
    localStorage.setItem(nombre, JSON.stringify(objeto));
  }

  borrarElementoSession(nombre: string) {
    localStorage.removeItem(nombre);
  }

  showLoading() {
    // Implementación de loading (modal, overlay, etc.) según tu proyecto
  }
  hideLoading() {
    // Implementación de hide loading
  }

  showSuccess(message: string) {
    return this.modalService.show(this.modalRef.SuccessModal);
  }
  showInfo(message: string) {
    return this.modalService.show(this.modalRef.InfoModal);
  }
  showDanger(message: string) {}
  showWarning(message: string) {}
  showConfirm(message: string) {}
}
