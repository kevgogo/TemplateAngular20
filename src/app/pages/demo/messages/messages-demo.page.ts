import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfirmService } from '@shared/components/dialogs/confirm/confirm.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-demo-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoMessagesPage {
  private readonly confirm: ConfirmService = inject(ConfirmService);
  private readonly sanitizer: DomSanitizer = inject(DomSanitizer);
  private readonly toastr: ToastrService = inject(ToastrService);

  // === CONFIRM ===

  async confirmarBasico(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Confirmación',
      message: '¿Deseas continuar?',
      okText: 'Sí',
      cancelText: 'No',
    });
    if (ok) this.toastr.success('Confirmado');
    else this.toastr.info('Cancelado');
  }

  async confirmarLgStatic(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Acción sensible',
      message: 'Esta acción no se puede deshacer.',
      okText: 'Entiendo',
      cancelText: 'Volver',
      size: 'lg',
      backdrop: 'static',
      ignoreBackdropClick: true,
      keyboard: false,
      modalClass: 'shadow-lg',
    });

    if (ok) {
      this.toastr.success('Ejecutado');
    } else {
      this.toastr.warning('Abortado');
    }
  }

  async confirmarConHtml(): Promise<void> {
    const html: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<div>Vas a <b>reemplazar</b> la configuración.<br><small>Revisa antes de confirmar.</small></div>`,
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

  infoMessage(): void {
    this.confirm.message({
      title: 'Información',
      message: 'Proceso en curso…',
      type_message: 'info',
      size: 'sm',
      modalClass: 'shadow',
      animated: true,
    });
  }

  warningMessageHtml(): void {
    const html = this.sanitizer.bypassSecurityTrustHtml(
      `<div class="text-warning"><i class="fa fa-warning me-1"></i> ¡Cuidado! Validaciones pendientes.</div>`,
    );
    this.confirm.message({
      title: 'Advertencia',
      html,
      type_message: 'warning',
      backdrop: true,
      ignoreBackdropClick: true,
    });
  }

  successMessageLgAnimOff(): void {
    this.confirm.message({
      title: 'Listo',
      message: 'Se guardó correctamente.',
      type_message: 'success',
      size: 'lg',
      animated: false, // sin fade
    });
  }

  // === SWEETALERT2 ARRIBA CENTRADO ===

  swalArriba(): void {
    // evita promesa flotante
    void Swal.fire({
      title: 'Hecho',
      text: 'SweetAlert centrado arriba',
      icon: 'success',
      position: 'top',
      showConfirmButton: false,
      timer: 1800,
      backdrop: true,
    });
  }

  swalToastArriba(): void {
    // evita promesa flotante
    void Swal.fire({
      toast: true,
      icon: 'info',
      title: 'Guardado',
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
    });
  }

  // === TOASTR OVERRIDES ===

  toastrCentro(): void {
    this.toastr.success('Operación OK', 'Listo', {
      positionClass: 'toast-top-center',
      timeOut: 6000,
      progressBar: true,
      closeButton: true,
    });
  }

  toastrErrorSticky(): void {
    this.toastr.error('No se pudo completar', 'Error', {
      positionClass: 'toast-bottom-right',
      disableTimeOut: true,
      closeButton: true,
      tapToDismiss: false,
    });
  }
}
