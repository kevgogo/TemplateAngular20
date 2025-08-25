// src/app/features/demo/files/files-demo.page.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-files-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './files-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesDemoPage {
  pdfUrl: string | null = null;
  excelPreview = signal<any[] | null>(null);
  zipEntries = signal<string[] | null>(null);

  onPdf(file: File) {
    this.pdfUrl && URL.revokeObjectURL(this.pdfUrl);
    this.pdfUrl = URL.createObjectURL(file);
  }

  async onExcel(file: File) {
    const XLSX: any = await import('xlsx'); // npm i xlsx
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
    this.excelPreview.set(json);
  }

  async onZip(file: File) {
    const JSZip: any = (await import('jszip')).default; // npm i jszip
    const zip = await JSZip.loadAsync(file);
    const names: string[] = [];
    zip.forEach((path: string) => names.push(path));
    this.zipEntries.set(names);
  }
}
