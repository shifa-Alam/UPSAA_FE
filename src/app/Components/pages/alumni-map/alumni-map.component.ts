import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import type * as Leaflet from 'leaflet';
import { CityCount, CommunityService } from '../../../Services/community.service';
import { LanguageService } from '../../../Services/language.service';
import { ThemeService } from '../../../Services/theme.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { Place, findPlace, inBangladesh } from '../../../Utils/city-coords';

/** One dot on the map: a known place with its alumni count (several spellings merged). */
interface Spot {
  place: Place;
  count: number;
  /** The spelling most members used — sent to the directory filter. */
  rawCity: string;
}

/**
 * Where our alumni live (/alumni-map, /portal/alumni-map): a bubble per city, sized by
 * how many alumni list it as their current city. Counts only — no names on the map;
 * a bubble links to the directory filtered by that city.
 * Leaflet renders its own DOM, so this component's styles are unencapsulated (am- prefix).
 */
@Component({
  selector: 'app-alumni-map',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe, PageHeaderComponent],
  templateUrl: './alumni-map.component.html',
  styleUrl: './alumni-map.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AlumniMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl?: ElementRef<HTMLElement>;

  private community = inject(CommunityService);
  private lang = inject(LanguageService);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  spots: Spot[] = [];
  /** Cities we couldn't place on the map (still counted). */
  unplaced: CityCount[] = [];
  total = 0;
  abroad = 0;
  loading = true;
  view: 'bd' | 'world' = 'bd';

  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private resizeObserver?: ResizeObserver;
  private layer?: Leaflet.LayerGroup;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.community.cities().pipe(catchError(() => of([] as CityCount[]))).subscribe(async cities => {
      this.prepare(cities);
      this.loading = false;
      await this.drawMap();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
    this.map = undefined;
  }

  get maxCount(): number {
    return Math.max(1, ...this.spots.map(s => s.count));
  }

  get topSpots(): Spot[] {
    return this.spots.slice(0, 10);
  }

  private prepare(cities: CityCount[]): void {
    const byPlace = new Map<Place, Spot>();
    for (const c of cities) {
      const place = findPlace(c.city);
      if (!place) {
        this.unplaced.push(c);
        continue;
      }
      const spot = byPlace.get(place);
      if (spot) {
        if (c.count > spot.count) spot.rawCity = c.city;
        spot.count += c.count;
      } else {
        byPlace.set(place, { place, count: c.count, rawCity: c.city });
      }
    }
    this.spots = [...byPlace.values()].sort((a, b) => b.count - a.count);
    this.total = cities.reduce((s, c) => s + c.count, 0);
    this.abroad = this.spots.filter(s => !inBangladesh(s.place)).reduce((s, x) => s + x.count, 0);
  }

  private async drawMap(): Promise<void> {
    if (!this.mapEl) return;
    const L = this.L = (await import('leaflet')).default ?? (await import('leaflet'));

    this.zone.runOutsideAngular(() => {
      const map = this.map = L.map(this.mapEl!.nativeElement, { zoomControl: true, scrollWheelZoom: false, worldCopyJump: true, zoomSnap: 0.5 });
      const dark = this.theme.theme?.() === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
      // Esri's gray canvas: quiet enough for the bubbles to stand out, and free without an API key
      // (CARTO's basemaps now need one). Base and labels are separate layers.
      const canvas = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_`;
      L.tileLayer(`${canvas}Base/MapServer/tile/{z}/{y}/{x}`, {
        attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        maxZoom: 16
      }).addTo(map);
      L.tileLayer(`${canvas}Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(map);

      this.layer = L.layerGroup().addTo(map);
      for (const s of this.spots) {
        const size = Math.round(28 + 34 * Math.sqrt(s.count / this.maxCount));
        const icon = L.divIcon({
          className: 'am-bubble-wrap',
          html: `<span class="am-bubble" style="width:${size}px;height:${size}px">${this.num(s.count)}</span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });
        L.marker([s.place.lat, s.place.lng], { icon, title: this.placeName(s.place) })
          .bindPopup(this.popupHtml(s))
          .addTo(this.layer!);
      }

      // Popup links go through the router (no full page reload).
      map.getContainer().addEventListener('click', e => {
        const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-city]');
        if (!link) return;
        e.preventDefault();
        const city = link.dataset['city'] ?? '';
        this.zone.run(() => this.router.navigate(['../members'], { relativeTo: this.route, queryParams: { city } }));
      });

      // First framing isn't animated — nothing to animate from, and it must not wait on a frame.
      map.invalidateSize();
      this.setView(this.view, false);

      // The container can still be settling (grid, fonts) when the map is created, and it
      // changes on rotate/resize: re-measure and re-frame whenever its width really changes,
      // or the map keeps a stale size and ends up zoomed too far out.
      let width = map.getContainer().clientWidth;
      this.resizeObserver = new ResizeObserver(() => {
        const w = map.getContainer().clientWidth;
        if (Math.abs(w - width) < 40) return;
        width = w;
        map.invalidateSize();
        this.setView(this.view, false);
      });
      this.resizeObserver.observe(map.getContainer());
    });
  }

  setView(view: 'bd' | 'world', animate = true): void {
    this.view = view;
    const L = this.L;
    if (!this.map || !L) return;
    if (view === 'bd') {
      // Frame where our alumni actually are (mostly greater Mymensingh/Dhaka), not the whole country.
      const home = this.spots.filter(s => inBangladesh(s.place)).map(s => L.latLng(s.place.lat, s.place.lng));
      const bounds = home.length > 1 ? L.latLngBounds(home) : L.latLngBounds([20.6, 88.0], [26.7, 92.7]);
      this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 9, animate });
    } else {
      const pts = this.spots.map(s => L.latLng(s.place.lat, s.place.lng));
      if (pts.length > 1) this.map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 5, animate });
      else this.map.setView([23.7, 90.4], 2, { animate });
    }
  }

  focus(s: Spot): void {
    if (!this.map) return;
    this.map.flyTo([s.place.lat, s.place.lng], inBangladesh(s.place) ? 10 : 6, { duration: 0.8 });
    this.mapEl?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  placeName(p: Place): string {
    return this.lang.lang() === 'bn' ? p.nameBn : p.name;
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  private popupHtml(s: Spot): string {
    const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    return `<div class="am-popup"><strong>${esc(this.placeName(s.place))}</strong>`
      + `<span>${this.num(s.count)} ${esc(this.lang.translate('alumniMap.alumni'))}</span>`
      + `<a href="#" data-city="${esc(s.rawCity)}">${esc(this.lang.translate('alumniMap.seeList'))} →</a></div>`;
  }
}
