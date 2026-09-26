import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { LanguageService } from '../../../Services/language.service';
import { eventInstant } from '../../../Utils/calendar';

interface Part { value: string; labelKey: string; }

/**
 * "12 days · 04 hrs · 36 min · 09 sec" until an event starts. Ticks once a second in
 * the browser only (outside Angular's zone, so it doesn't re-check the whole page),
 * and hides itself once the moment has passed.
 */
@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './countdown.component.html',
  styleUrl: './countdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownComponent implements OnInit, OnChanges, OnDestroy {
  /** Event start, as the API sends it (Dhaka wall-clock time). */
  @Input({ required: true }) target!: string;

  parts: Part[] = [];
  done = false;

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly lang = inject(LanguageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    this.tick();
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.tick();
        this.cdr.detectChanges();
        if (this.done) this.stop();
      }, 1000);
    });
  }

  ngOnChanges(): void {
    this.tick();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const ms = eventInstant(this.target).getTime() - Date.now();
    this.done = !(ms > 0);
    if (this.done) {
      this.parts = [];
      return;
    }
    const s = Math.floor(ms / 1000);
    const nf = new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { minimumIntegerDigits: 2 });
    this.parts = [
      { value: nf.format(Math.floor(s / 86400)), labelKey: 'countdown.days' },
      { value: nf.format(Math.floor((s % 86400) / 3600)), labelKey: 'countdown.hours' },
      { value: nf.format(Math.floor((s % 3600) / 60)), labelKey: 'countdown.minutes' },
      { value: nf.format(s % 60), labelKey: 'countdown.seconds' }
    ];
  }
}
