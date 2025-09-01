// src/app/features/demo/adder/adder.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdderComponent } from './adder.component';

function setVal(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Guard util para tipar el host del fixture
function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  const el: unknown = fixture.nativeElement;
  if (el instanceof HTMLElement) return el;
  throw new Error('El host del fixture no es un HTMLElement');
}

// querySelector tipado con genérico y sin casts innecesarios
function q<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`No se encontró el selector: ${selector}`);
  return el; // tras el guard, T no es null
}

describe('AdderComponent (demo/test)', () => {
  async function create(): Promise<ComponentFixture<AdderComponent>> {
    await TestBed.configureTestingModule({
      imports: [AdderComponent], // componente standalone
    }).compileComponents();
    const fixture = TestBed.createComponent(AdderComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('inicia en 0', async () => {
    const fixture = await create();
    const host = getHost(fixture);
    const sum = q<HTMLElement>(host, '[data-testid="sum"]');
    expect((sum.textContent ?? '').trim()).toBe('Resultado: 0');
  });

  it('2 + 3 = 5', async () => {
    const fixture = await create();
    const host = getHost(fixture);

    const a = q<HTMLInputElement>(host, '[data-testid="a"]');
    const b = q<HTMLInputElement>(host, '[data-testid="b"]');

    setVal(a, '2');
    setVal(b, '3');
    fixture.detectChanges();

    const sum = q<HTMLElement>(host, '[data-testid="sum"]');
    expect((sum.textContent ?? '').trim()).toBe('Resultado: 5');
  });

  it('maneja decimales/negativos (1.5 + -0.5 = 1)', async () => {
    const fixture = await create();
    const host = getHost(fixture);

    setVal(q<HTMLInputElement>(host, '[data-testid="a"]'), '1.5');
    setVal(q<HTMLInputElement>(host, '[data-testid="b"]'), '-0.5');
    fixture.detectChanges();

    const sum = q<HTMLElement>(host, '[data-testid="sum"]');
    expect((sum.textContent ?? '').trim()).toBe('Resultado: 1');
  });

  it('si A no es numérico, toma 0', async () => {
    const fixture = await create();
    const host = getHost(fixture);

    setVal(q<HTMLInputElement>(host, '[data-testid="a"]'), 'abc');
    setVal(q<HTMLInputElement>(host, '[data-testid="b"]'), '4');
    fixture.detectChanges();

    const sum = q<HTMLElement>(host, '[data-testid="sum"]');
    expect((sum.textContent ?? '').trim()).toBe('Resultado: 4');
  });
});
