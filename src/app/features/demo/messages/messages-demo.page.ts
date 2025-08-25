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
      title: `Mensaje ${type.toUpperCase()}`,
      message: `Este es un mensaje de tipo ${type}.`,
      type_message: type,
      okText: 'Cerrar', // ⬅️ antes: closeButtonText
    });
  }

  askConfirm() {
    this.confirm.confirm({
      title: '¿Confirmar acción?',
      message: 'Esta acción no se puede deshacer.',
      okText: 'Sí, continuar', // ⬅️ antes: okButtonText
      cancelText: 'No, cancelar', // ⬅️ antes: cancelButtonText
      onYes: () => this.showMessage('success'),
      onNo: () => this.showMessage('warning'),
    });
  }
}
