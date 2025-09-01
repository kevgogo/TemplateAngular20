// src/app/features/demo/files/files-demo.page.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type ExcelRow = Record<string, unknown>;

@Component({
  selector: 'app-files-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './files-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesDemoPage implements OnDestroy {
  pdfUrl: string | null = null;
  excelPreview = signal<ExcelRow[] | null>(null);
  zipEntries = signal<string[] | null>(null);

  ngOnDestroy(): void {
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
      this.pdfUrl = null;
    }
  }

  onPdf(file: File): void {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    this.pdfUrl = URL.createObjectURL(file);
  }

  async onExcel(file: File): Promise<void> {
    try {
      const XLSX = await import('xlsx'); // TIPADO: usa los tipos del paquete
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const firstName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstName];

      if (!firstSheet) {
        this.excelPreview.set([]);
        return;
      }

      const json = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet, {
        defval: null,
      });
      this.excelPreview.set(json);
    } catch (err) {
      console.error('Error leyendo Excel:', err);
      this.excelPreview.set([]);
    }
  }

  async onZip(file: File): Promise<void> {
    try {
      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(file);

      const names: string[] = [];
      zip.forEach((relativePath) => {
        names.push(relativePath);
      });

      this.zipEntries.set(names);
    } catch (err) {
      console.error('Error leyendo ZIP:', err);
      this.zipEntries.set([]);
    }
  }
}
