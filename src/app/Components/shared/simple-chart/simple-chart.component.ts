import { isPlatformBrowser } from '@angular/common';
import {
  Component, ElementRef, Input, OnChanges, OnDestroy, PLATFORM_ID, ViewChild, effect, inject, untracked
} from '@angular/core';
import {
  BarController, BarElement, CategoryScale, Chart, Filler, Legend, LinearScale, LineController,
  LineElement, PointElement, Tooltip
} from 'chart.js';
import { ThemeService } from '../../../Services/theme.service';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export interface SimpleChartDataset {
  label: string;
  data: number[];
  /** A CSS custom property from the design tokens, e.g. '--color-primary-600', so dark mode follows. */
  colorVar: string;
}

export interface SimpleChartConfig {
  type: 'bar' | 'line';
  labels: string[];
  datasets: SimpleChartDataset[];
  /** Formats y-axis ticks and tooltip values (e.g. currency, localized digits). */
  formatValue?: (value: number) => string;
}

/** Thin chart.js wrapper: token colours, theme-aware, browser-only (the app also renders on the server). */
@Component({
  selector: 'app-simple-chart',
  standalone: true,
  template: `<canvas #canvas role="img" [attr.aria-label]="ariaLabel"></canvas>`,
  styles: [`
    :host { display: block; position: relative; width: 100%; height: var(--chart-height, 240px); }
    canvas { width: 100% !important; height: 100% !important; }
  `]
})
export class SimpleChartComponent implements OnChanges, OnDestroy {
  @Input() config: SimpleChartConfig | null = null;
  @Input() ariaLabel = '';
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      this.theme.theme();
      // The theme service updates <html data-theme> itself; read the new token values after it has.
      untracked(() => setTimeout(() => this.render()));
    });
  }

  ngOnChanges(): void {
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.isBrowser || !this.config || !this.canvas) return;
    this.chart?.destroy();

    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const ink = token('--color-ink-600', '#64748b');
    const grid = token('--color-ink-200', '#e2e8f0');
    const format = this.config.formatValue ?? ((v: number) => String(v));
    const isLine = this.config.type === 'line';

    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.config.type,
      data: {
        labels: this.config.labels,
        datasets: this.config.datasets.map(ds => {
          const color = token(ds.colorVar, '#1d4ed8');
          return {
            label: ds.label,
            data: ds.data,
            backgroundColor: isLine ? withAlpha(color, 0.12) : color,
            borderColor: color,
            borderWidth: isLine ? 2 : 0,
            borderRadius: isLine ? 0 : 4,
            maxBarThickness: 36,
            fill: isLine,
            tension: 0.3,
            pointRadius: isLine ? 3 : 0,
            pointBackgroundColor: color
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: this.config.datasets.length > 1,
            position: 'bottom',
            labels: { color: ink, boxWidth: 12, boxHeight: 12, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${format(Number(ctx.parsed.y))}`
            }
          }
        },
        scales: {
          x: { ticks: { color: ink, maxRotation: 0, autoSkip: true }, grid: { display: false }, border: { color: grid } },
          y: {
            beginAtZero: true,
            ticks: { color: ink, precision: 0, callback: v => format(Number(v)) },
            grid: { color: grid },
            border: { display: false }
          }
        }
      }
    });
  }
}

/** '#1d4ed8' or 'rgb(...)' → the same colour at the given opacity. */
function withAlpha(color: string, alpha: number): string {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map(s => s.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
