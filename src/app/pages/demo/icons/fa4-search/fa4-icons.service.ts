import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Fa4Icon, Fa4IconsPayload } from './fa4-icon.types';

@Injectable({ providedIn: 'root' })
export class Fa4IconsService {
  private http = inject(HttpClient);
  private _all = signal<Fa4Icon[] | null>(null);

  get all() {
    return this._all;
  }

  load(): Promise<Fa4Icon[]> {
    const current = this._all();
    if (current) return Promise.resolve(current);

    return this.http
      .get<Fa4IconsPayload>('assets/fa4-icons.json')
      .toPromise()
      .then((payload) => {
        const list = payload?.icons ?? [];
        this._all.set(list);
        return list;
      });
  }
}
