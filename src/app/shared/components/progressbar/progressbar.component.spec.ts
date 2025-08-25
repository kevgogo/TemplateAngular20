import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProgressbarComponent } from './progressbar.component';

describe('ProgressbarComponent', () => {
  let component: ProgressbarComponent;
  let fixture: ComponentFixture<ProgressbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct width for simple mode', () => {
    component.min = 0;
    component.max = 100;
    component.value = 25;
    component.ngOnChanges();
    fixture.detectChanges();

    const bar = fixture.debugElement.query(By.css('.progress-bar')).nativeElement as HTMLElement;
    expect(bar.style.width).toContain('25%');
  });

  it('should render stacked segments with scaled widths', () => {
    component.max = 100;
    component.stacked = [
      { value: 10, type: 'success', label: 'A' },
      { value: 30, type: 'warning', label: 'B' },
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    const bars = fixture.debugElement.queryAll(By.css('.progress-bar'));
    expect(bars.length).toBe(2);
    expect((bars[0].nativeElement as HTMLElement).style.width).toContain('10%');
    expect((bars[1].nativeElement as HTMLElement).style.width).toContain('30%');
  });
});
