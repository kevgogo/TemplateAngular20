import { TestBed } from '@angular/core/testing';
import { AdderComponent } from './adder.component';

function setVal(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('AdderComponent (demo/test)', () => {
  it('inicia en 0', () => {
    const fixture = TestBed.createComponent(AdderComponent);
    fixture.detectChanges();
    const sum = fixture.nativeElement.querySelector(
      '[data-testid="sum"]'
    ) as HTMLElement;
    expect(sum.textContent?.trim()).toBe('Resultado: 0');
  });

  it('2 + 3 = 5', () => {
    const fixture = TestBed.createComponent(AdderComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const a = host.querySelector<HTMLInputElement>('[data-testid="a"]')!;
    const b = host.querySelector<HTMLInputElement>('[data-testid="b"]')!;

    setVal(a, '2');
    setVal(b, '3');
    fixture.detectChanges();

    const sum = host.querySelector<HTMLElement>('[data-testid="sum"]')!;
    expect(sum.textContent?.trim()).toBe('Resultado: 5');
  });

  it('maneja decimales/negativos (1.5 + -0.5 = 1)', () => {
    const fixture = TestBed.createComponent(AdderComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    setVal(host.querySelector<HTMLInputElement>('[data-testid="a"]')!, '1.5');
    setVal(host.querySelector<HTMLInputElement>('[data-testid="b"]')!, '-0.5');
    fixture.detectChanges();

    const sum = host.querySelector<HTMLElement>('[data-testid="sum"]')!;
    expect(sum.textContent?.trim()).toBe('Resultado: 1');
  });

  it('si A no es numérico, toma 0', () => {
    const fixture = TestBed.createComponent(AdderComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    setVal(host.querySelector<HTMLInputElement>('[data-testid="a"]')!, 'abc');
    setVal(host.querySelector<HTMLInputElement>('[data-testid="b"]')!, '4');
    fixture.detectChanges();

    const sum = host.querySelector<HTMLElement>('[data-testid="sum"]')!;
    expect(sum.textContent?.trim()).toBe('Resultado: 4');
  });
});
