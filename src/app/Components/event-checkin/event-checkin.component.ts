import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, interval, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { CheckInAttendee, CheckInResult, CheckInService, CheckInSummary } from '../../Services/checkin.service';
import { MemberService, PublicMember } from '../../Services/member.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../Pipes/sized-image.pipe';

/** What the last scan did, for the big result card. */
interface ScanOutcome {
  kind: 'ok' | 'already' | 'error';
  result?: CheckInResult;
  message?: string;
}

/** Chrome/Android's built-in QR reader; iPhone Safari lacks it, so jsQR takes over there. */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

/** Same card scanned again within this time is ignored (the camera sees it many times a second). */
const SAME_CODE_MS = 4000;
/** Other volunteers' check-ins show up within this long. */
const REFRESH_MS = 20000;

/**
 * Event gate check-in: scan the QR on a member's card (camera), or type their member
 * code, or find them by name. Shows who came and who said "I'm going" but hasn't
 * arrived yet. Several volunteers can check in at once — the lists refresh themselves.
 */
@Component({
  selector: 'app-event-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, AdminHeaderComponent, SectionCardComponent,
    EmptyStateComponent, SkeletonComponent, TranslatePipe, SizedImagePipe],
  templateUrl: './event-checkin.component.html',
  styleUrl: './event-checkin.component.scss'
})
export class EventCheckinComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  private route = inject(ActivatedRoute);
  private api = inject(CheckInService);
  private members = inject(MemberService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  eventId = 0;
  summary: CheckInSummary | null = null;
  loading = true;
  loadError = false;
  tab: 'arrived' | 'notYet' = 'arrived';

  // Camera
  cameraOn = false;
  cameraStarting = false;
  cameraError: string | null = null;
  private stream: MediaStream | null = null;
  private detector: BarcodeDetectorLike | null = null;
  private jsQR: ((data: Uint8ClampedArray, w: number, h: number, opts?: object) => { data: string } | null) | null = null;
  private canvas?: HTMLCanvasElement;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCode = '';
  private lastCodeAt = 0;

  // Check-in
  busy = false;
  outcome: ScanOutcome | null = null;
  manualCode = '';
  nameQuery = '';
  nameResults: PublicMember[] = [];
  private name$ = new Subject<string>();
  undoingId: number | null = null;

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    this.refresh();
    interval(REFRESH_MS).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh(true));

    this.name$.pipe(
      map(q => q.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => q.length < 2 ? of([]) : this.members.getPublicDirectory({ pageNumber: 1, pageSize: 6, fullName: q }).pipe(
        map(r => r.members), catchError(() => of([])))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(list => this.nameResults = list);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  refresh(quiet = false): void {
    if (!quiet) this.loading = true;
    this.api.summary(this.eventId).subscribe({
      next: s => { this.summary = s; this.loading = false; this.loadError = false; },
      error: () => { this.loading = false; if (!quiet) this.loadError = true; }
    });
  }

  // ------------------------------------------------------------ camera

  async startCamera(): Promise<void> {
    if (this.cameraOn || this.cameraStarting) return;
    this.cameraError = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError = this.lang.translate('checkIn.cameraUnsupported');
      return;
    }
    this.cameraStarting = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => BarcodeDetectorLike }).BarcodeDetector;
      this.detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
      if (!this.detector && !this.jsQR) this.jsQR = (await import('jsqr')).default as never;

      this.cameraOn = true;
      // The <video> appears once cameraOn is set; wait a tick for it.
      await new Promise(r => setTimeout(r));
      const video = this.videoRef!.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.zone.runOutsideAngular(() => this.scheduleScan());
    } catch (err) {
      this.stopCamera();
      const name = (err as DOMException)?.name;
      this.cameraError = this.lang.translate(name === 'NotAllowedError' ? 'checkIn.cameraDenied' : 'checkIn.cameraFailed');
    } finally {
      this.cameraStarting = false;
    }
  }

  stopCamera(): void {
    if (this.scanTimer) clearTimeout(this.scanTimer);
    this.scanTimer = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.cameraOn = false;
  }

  private scheduleScan(): void {
    this.scanTimer = setTimeout(() => this.scanFrame(), 180);
  }

  private async scanFrame(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    if (!this.cameraOn || !video) return;
    try {
      if (video.readyState >= 2 && !this.busy) {
        const text = await this.readCode(video);
        if (text) this.zone.run(() => this.onScanned(text));
      }
    } catch { /* a frame that couldn't be read — try the next */ }
    if (this.cameraOn) this.scheduleScan();
  }

  private async readCode(video: HTMLVideoElement): Promise<string | null> {
    if (this.detector) {
      const codes = await this.detector.detect(video);
      return codes[0]?.rawValue ?? null;
    }
    if (!this.jsQR) return null;
    // Scale down: jsQR is plain JS, and a 640px frame is plenty for a card held up close.
    const scale = Math.min(1, 640 / video.videoWidth);
    const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
    this.canvas ??= document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, w, h);
    return this.jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })?.data ?? null;
  }

  private onScanned(text: string): void {
    const now = Date.now();
    if (text === this.lastCode && now - this.lastCodeAt < SAME_CODE_MS) return;
    this.lastCode = text;
    this.lastCodeAt = now;
    this.checkIn(text);
  }

  // ------------------------------------------------------------ check-in

  submitManual(): void {
    const code = this.manualCode.trim();
    if (!code) return;
    this.checkIn(code, () => this.manualCode = '');
  }

  onNameInput(): void {
    this.name$.next(this.nameQuery);
  }

  checkInMember(m: PublicMember): void {
    this.checkIn(String(m.id), () => { this.nameQuery = ''; this.nameResults = []; });
  }

  private checkIn(code: string, done?: () => void): void {
    if (this.busy) return;
    this.busy = true;
    this.api.checkIn(this.eventId, code).subscribe({
      next: result => {
        this.busy = false;
        this.outcome = { kind: result.already ? 'already' : 'ok', result };
        this.feedback(result.already ? 'already' : 'ok');
        done?.();
        this.refresh(true);
      },
      error: err => {
        this.busy = false;
        this.outcome = { kind: 'error', message: err?.error?.message ?? this.lang.translate('checkIn.failed') };
        this.feedback('error');
      }
    });
  }

  undo(a: CheckInAttendee): void {
    if (this.undoingId) return;
    this.undoingId = a.memberId;
    this.api.undo(this.eventId, a.memberId).subscribe({
      next: () => {
        this.undoingId = null;
        this.snackbar.showSuccess(`${a.fullName} — ${this.lang.translate('checkIn.undone')}`);
        if (this.outcome?.result?.member.memberId === a.memberId) this.outcome = null;
        this.refresh(true);
      },
      error: () => {
        this.undoingId = null;
        this.snackbar.showError(this.lang.translate('checkIn.failed'));
      }
    });
  }

  /** A buzz and a sound, so the volunteer needn't look at the screen for every card. */
  private feedback(kind: ScanOutcome['kind']): void {
    try { navigator.vibrate?.(kind === 'ok' ? 60 : [60, 80, 60]); } catch { /* not supported */ }
    if (kind === 'ok') {
      const audio = new Audio('sounds/pop.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => { /* autoplay blocked until the first tap */ });
    }
  }

  // ------------------------------------------------------------ display

  num(value: number, plain = false): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: !plain }).format(value);
  }

  time(value: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(value).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }

  date(value: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(value).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  trackMember = (_: number, p: { memberId: number }) => p.memberId;
}
