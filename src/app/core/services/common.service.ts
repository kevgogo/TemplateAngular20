import { Injectable, TemplateRef, Type, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';

type ModalName = 'SuccessModal' | 'InfoModal' | 'DangerModal' | 'WarningModal';
type ModalContent = TemplateRef<unknown> | Type<unknown> | string;
type ToastType = 'success' | 'warning' | 'info' | 'error';

interface ErrorState {
  code: string;
  error: string;
  message: string;
  from: string;
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class CommonService {
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly modalService = inject(BsModalService);

  /** Registro de contenidos para modales (Template/Componente/String) */
  public modalRef: Partial<Record<ModalName, ModalContent>> = {
    SuccessModal: undefined,
    InfoModal: undefined,
    DangerModal: undefined,
    WarningModal: undefined,
  };

  private resolveErrorTarget(code: number): string {
    if (code === 401) return '/error/401';
    if (code === 403) return '/error/403';
    if (code === 404) return '/error/404';
    if (code === 0 || code === 503 || (code >= 500 && code < 600))
      return '/error/500';
    return '/error/500';
  }

  private buildErrorState(data?: {
    code?: string | number;
    error?: string;
    message?: string;
  }): ErrorState {
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
    T extends { code?: string; error?: string; message?: string },
  >(): T {
    return (history.state ?? {}) as T;
  }

  redirecToError(data: {
    code: string;
    error: string;
    message: string;
  }): Promise<boolean> {
    const codeNum = Number(data?.code ?? 500);
    const target = this.resolveErrorTarget(codeNum);
    const state = this.buildErrorState({ ...data, code: codeNum });
    return this.router.navigateByUrl(target, { state });
  }

  redirecToUnauthorized(data: {
    code: string;
    error: string;
    message: string;
  }): Promise<boolean> {
    const state = this.buildErrorState({ ...data, code: 401 });
    return this.router.navigateByUrl('/error/401', { state });
  }

  redirectToNotFound(data: {
    code: string;
    error: string;
    message: string;
  }): Promise<boolean> {
    const state = this.buildErrorState({ ...data, code: 404 });
    return this.router.navigateByUrl('/error/404', { state });
  }

  showNotification(type: ToastType, message: string, title: string): void {
    if (type === 'success') this.toastr.success(message, title);
    else if (type === 'warning') this.toastr.warning(message, title);
    else if (type === 'info') this.toastr.info(message, title);
    else if (type === 'error') this.toastr.error(message, title);
  }

  obtenerElementoSession<T = unknown>(
    nombre: string,
    fallback: T | null = null,
  ): T | null {
    const raw = localStorage.getItem(nombre);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Si estaba guardado como string plano, intenta devolverlo si T lo admite
      return raw as unknown as T;
    }
  }

  registrarElementoSession(nombre: string, objeto: unknown): void {
    localStorage.setItem(nombre, JSON.stringify(objeto));
  }

  borrarElementoSession(nombre: string): void {
    localStorage.removeItem(nombre);
  }

  showLoading(): void {
    // TODO: Implementación de overlay/spinner centralizado
  }

  hideLoading(): void {
    // TODO: Ocultar overlay/spinner
  }

  /* ====================== Modales (wrappers) ====================== */

  private showModalByName(
    name: ModalName,
    initialState?: ModalOptions['initialState'],
  ): BsModalRef | undefined {
    const content = this.modalRef[name];
    if (!content) return undefined;

    const config: ModalOptions = initialState ? { initialState } : {};
    return this.modalService.show(
      content as TemplateRef<unknown> | Type<unknown> | string,
      config,
    );
  }

  showSuccess(message: string): BsModalRef | undefined {
    return this.showModalByName('SuccessModal', { message });
  }

  showInfo(message: string): BsModalRef | undefined {
    return this.showModalByName('InfoModal', { message });
  }

  showDanger(message: string): BsModalRef | undefined {
    return this.showModalByName('DangerModal', { message });
  }

  showWarning(message: string): BsModalRef | undefined {
    return this.showModalByName('WarningModal', { message });
  }
}
