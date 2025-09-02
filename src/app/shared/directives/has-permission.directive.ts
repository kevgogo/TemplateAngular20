import {
  Directive,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { CommonService } from '@core/services/common.service';

type PermItem =
  | string
  | {
      name?: string;
      permission?: string;
      code?: string;
      permission_name?: string;
      Permission?: string;
      Name?: string;
    };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function readStringField(obj: unknown, key: string): string | null {
  if (!isObject(obj)) return null;
  const v = obj[key];
  return typeof v === 'string' ? v : null;
}

function normalizePermissions(raw: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(raw)) return out;

  for (const it of raw as unknown[]) {
    if (typeof it === 'string') {
      const v = it.trim().toLowerCase();
      if (v) out.add(v);
    } else if (isObject(it)) {
      const cand =
        readStringField(it, 'name') ??
        readStringField(it, 'permission') ??
        readStringField(it, 'code') ??
        readStringField(it, 'permission_name') ??
        readStringField(it, 'Permission') ??
        readStringField(it, 'Name');

      if (cand) out.add(cand.trim().toLowerCase());
    }
  }
  return out;
}

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnChanges {
  private readonly vcr = inject(ViewContainerRef);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly common = inject(CommonService);

  @Input('appHasPermission') code?: string;

  private permSet: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.loadPermissionsFromSession();
    this.render();
  }

  ngOnChanges(): void {
    this.render();
  }

  private loadPermissionsFromSession(): void {
    const raw = this.common.obtenerElementoSession<PermItem[]>(
      'permission_menu',
      [],
    );
    this.permSet = normalizePermissions(raw);
  }

  private render(): void {
    const ok = this.check(this.code);
    this.vcr.clear();
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }

  private check(code?: string): boolean {
    if (!code) return true;

    const wanted = code.trim().toLowerCase();
    if (!wanted) return true;

    if (this.permSet.size === 0) this.loadPermissionsFromSession();

    return this.permSet.size === 0 || this.permSet.has(wanted);
  }
}
