import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '@shared/components/dialogs/confirm/confirm.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-demo-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages-demo.page.html',
})
export class DemoMessagesPage {
  constructor(
    private confirm: ConfirmService,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) {}

  // === CONFIRM ===

  async confirmarBasico() {
    const ok = await this.confirm.confirm({
      title: 'Confirmación',
      message: '¿Deseas continuar?',
      okText: 'Sí',
      cancelText: 'No',
    });
    if (ok) this.toastr.success('Confirmado');
    else this.toastr.info('Cancelado');
  }

  async confirmarLgStatic() {
    const ok = await this.confirm.confirm({
      title: 'Acción sensible',
      message: 'Esta acción no se puede deshacer.',
      okText: 'Entiendo',
      cancelText: 'Volver',
      size: 'lg', // <— tamaño 'lg'
      backdrop: 'static', // <— no cierra por clic fuera
      ignoreBackdropClick: true, // redundante pero explícito
      keyboard: false, // <— no cierra con ESC
      modalClass: 'shadow-lg', // <— clases extra si quieres
    });
    ok ? this.toastr.success('Ejecutado') : this.toastr.warning('Abortado');
  }

  async confirmarConHtml() {
    const html: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<div>Vas a <b>reemplazar</b> la configuración.<br><small>Revisa antes de confirmar.</small></div>`
    );
    const ok = await this.confirm.confirm({
      title: 'Reemplazar configuración',
      html,
      okText: 'Reemplazar',
      cancelText: 'Cancelar',
      size: 'sm',
      animated: true,
    });
    this.toastr.show(ok ? 'Reemplazada' : 'Sin cambios', 'Configuración');
  }

  // === MESSAGE ===

  infoMessage() {
    this.confirm.message({
      title: 'Información',
      message: 'Proceso en curso…',
      type_message: 'info',
      size: 'sm',
      modalClass: 'shadow',
      animated: true,
    });
  }

  warningMessageHtml() {
    const html = this.sanitizer.bypassSecurityTrustHtml(
      `<div class="text-warning"><i class="fa fa-warning me-1"></i> ¡Cuidado! Validaciones pendientes.</div>`
    );
    this.confirm.message({
      title: 'Advertencia',
      html,
      type_message: 'warning',
      backdrop: true,
      ignoreBackdropClick: true,
    });
  }

  successMessageLgAnimOff() {
    this.confirm.message({
      title: 'Listo',
      message: 'Se guardó correctamente.',
      type_message: 'success',
      size: 'lg',
      animated: false, // sin fade
    });
  }

  // === SWEETALERT2 ARRIBA CENTRADO ===

  swalArriba() {
    Swal.fire({
      title: 'Hecho',
      text: 'SweetAlert centrado arriba',
      icon: 'success',
      position: 'top', // <— centrado arriba
      showConfirmButton: false,
      timer: 1800,
      backdrop: true,
    });
  }

  swalToastArriba() {
    Swal.fire({
      toast: true,
      icon: 'info',
      title: 'Guardado',
      position: 'top', // <— arriba centrado (toast)
      showConfirmButton: false,
      timer: 2000,
    });
  }

  // === TOASTR OVERRIDES ===

  toastrCentro() {
    this.toastr.success('Operación OK', 'Listo', {
      positionClass: 'toast-top-center',
      timeOut: 6000,
      progressBar: true,
      closeButton: true,
    });
  }

  toastrErrorSticky() {
    this.toastr.error('No se pudo completar', 'Error', {
      positionClass: 'toast-bottom-right',
      disableTimeOut: true, // queda fijo hasta cerrar
      closeButton: true,
      tapToDismiss: false,
    });
  }
}
