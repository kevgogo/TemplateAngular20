import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '@shared/components/dialogs/confirm/confirm.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

@Component({
  selector: 'app-messages-demo',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './messages-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesDemoPage {
  constructor(private confirm: ConfirmService) {}

  showMessage(type: 'success' | 'info' | 'warning' | 'error') {
    this.confirm.message({
      title: 'Mensaje de ejemplo',
      message: `Este es un mensaje de tipo: ${type.toUpperCase()}`,
      type_message: type,
      closeButtonText: 'Cerrar',
    });
  }

  askConfirm() {
    this.confirm.confirm({
      title: '¿Confirmar acción?',
      message: 'Esta acción no se puede deshacer.',
      okButtonText: 'Sí, continuar',
      cancelButtonText: 'No, cancelar',
      onYes: () => this.showMessage('success'),
      onNo: () => this.showMessage('warning'),
    });
  }
}
