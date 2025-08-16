import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

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

  redirecToError(data: { code: string; error: string; message: string }) {
    return this.router.navigate(['/error'], { state: { datos: data } });
  }
  redirecToUnauthorized(data: {
    code: string;
    error: string;
    message: string;
  }) {
    return this.router.navigate(['/error'], { state: { datos: data } });
  }
  redirecToNoFound(data: { code: string; error: string; message: string }) {
    return this.router.navigate(['/error'], { state: { datos: data } });
  }

  showNotification(type: string, message: string, title: string) {
    if (type == 'warning') this.toastr.warning(message, title);
    else if (type == 'info') this.toastr.info(message, title);
    else if (type == 'error') this.toastr.error(message, title);
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
