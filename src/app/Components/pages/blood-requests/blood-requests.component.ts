import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  BLOOD_GROUPS, BloodGroup, BloodRequest, BloodRequestSave, BloodResponder, CAN_GIVE_TO, CommunityService
} from '../../../Services/community.service';
import { AuthService } from '../../../Services/auth.service';
import { ConfirmService } from '../../../Services/confirm.service';
import { LanguageService } from '../../../Services/language.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../../Pipes/sized-image.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';

const emptyForm = (): BloodRequestSave => ({
  bloodGroup: '', units: 1, patientName: '', hospital: '', city: '', neededBy: '', contactPhone: '', note: '', shareOnFacebook: true
});

/**
 * Urgent blood requests (members only; /portal/blood-requests and /dashboard/blood-requests).
 * Posting notifies every alumnus whose blood group can be given to the patient; they
 * answer "I can donate", and the requester sees who did — with their phone numbers.
 */
@Component({
  selector: 'app-blood-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TranslatePipe, SizedImagePipe, PageHeaderComponent, SkeletonComponent],
  templateUrl: './blood-requests.component.html',
  styleUrl: './blood-requests.component.scss'
})
export class BloodRequestsComponent implements OnInit {
  private community = inject(CommunityService);
  private confirm = inject(ConfirmService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  readonly groups = BLOOD_GROUPS;

  requests: BloodRequest[] = [];
  loading = true;
  includeClosed = false;
  /** ?id= from a notification — that card is highlighted. */
  targetId: number | null = null;

  showForm = false;
  form: BloodRequestSave = emptyForm();
  saving = false;

  busyId: number | null = null;
  /** Responders shown under the requester's own cards. */
  responders: Record<number, BloodResponder[] | 'loading'> = {};

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
      const id = Number(p.get('id'));
      this.targetId = Number.isInteger(id) && id > 0 ? id : null;
    });
    this.load();
  }

  /** Staff accounts aren't linked to a member record, so they can view but not post. */
  get canPost(): boolean {
    return this.auth.hasMemberRecord();
  }

  load(): void {
    this.loading = true;
    this.community.bloodRequests(this.includeClosed).pipe(catchError(() => of([] as BloodRequest[]))).subscribe(list => {
      this.loading = false;
      this.requests = list;
      if (this.targetId !== null) {
        setTimeout(() => document.getElementById(`blood-${this.targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
      }
    });
  }

  toggleClosed(value: boolean): void {
    if (this.includeClosed === value) return;
    this.includeClosed = value;
    this.load();
  }

  openForm(): void {
    this.form = emptyForm();
    // Default "needed by": in 6 hours.
    const d = new Date(Date.now() + 6 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    this.form.neededBy = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
    this.showForm = true;
  }

  submit(): void {
    const f = this.form;
    if (!f.bloodGroup) return this.error('bloodRequests.errGroup');
    if (!f.hospital.trim()) return this.error('bloodRequests.errHospital');
    if (!f.contactPhone.trim()) return this.error('bloodRequests.errPhone');
    if (!f.neededBy) return this.error('bloodRequests.errWhen');

    this.saving = true;
    this.community.createBloodRequest({ ...f, neededBy: f.neededBy + ':00' }).subscribe({
      next: created => {
        this.saving = false;
        this.showForm = false;
        this.snackbar.showSuccess(this.lang.translate('bloodRequests.posted'));
        this.requests = [created, ...this.requests];
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message || this.lang.translate('bloodRequests.saveFailed'));
      }
    });
  }

  respond(r: BloodRequest): void {
    const go = () => {
      this.busyId = r.id;
      this.community.respondToBloodRequest(r.id).subscribe({
        next: res => {
          this.busyId = null;
          r.iResponded = res.responded;
          r.responseCount = res.count;
          this.snackbar.showSuccess(this.lang.translate(res.responded ? 'bloodRequests.responded' : 'bloodRequests.unresponded'));
        },
        error: err => {
          this.busyId = null;
          this.snackbar.showError(err?.error?.message || this.lang.translate('bloodRequests.saveFailed'));
        }
      });
    };
    if (r.iResponded) return go();
    this.confirm.ask({
      title: this.lang.translate('bloodRequests.confirmTitle'),
      message: this.lang.translate('bloodRequests.confirmMessage'),
      confirmText: this.lang.translate('bloodRequests.canDonate')
    }).subscribe(ok => ok && go());
  }

  toggleResponders(r: BloodRequest): void {
    if (this.responders[r.id]) {
      delete this.responders[r.id];
      return;
    }
    this.responders[r.id] = 'loading';
    this.community.bloodResponders(r.id).pipe(catchError(() => of([] as BloodResponder[]))).subscribe(list => this.responders[r.id] = list);
  }

  respondersOf(r: BloodRequest): BloodResponder[] | null {
    const v = this.responders[r.id];
    return Array.isArray(v) ? v : null;
  }

  close(r: BloodRequest, status: 'Fulfilled' | 'Cancelled'): void {
    this.confirm.ask({
      message: this.lang.translate(status === 'Fulfilled' ? 'bloodRequests.confirmFulfilled' : 'bloodRequests.confirmCancel'),
      danger: status === 'Cancelled'
    }).subscribe(ok => {
      if (!ok) return;
      this.busyId = r.id;
      this.community.setBloodRequestStatus(r.id, status).subscribe({
        next: () => {
          this.busyId = null;
          r.status = status;
          if (!this.includeClosed) this.requests = this.requests.filter(x => x.id !== r.id);
        },
        error: () => {
          this.busyId = null;
          this.snackbar.showError(this.lang.translate('bloodRequests.saveFailed'));
        }
      });
    });
  }

  // ---------------------------------------------------------------- display helpers

  private get locale(): string {
    return this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  /** "সোম, ২৮ সেপ, সকাল ১০:৩০" — in Bangla the time of day is a word, not AM/PM. */
  when(r: BloodRequest): string {
    const d = new Date(r.neededBy);
    if (this.lang.lang() !== 'bn') {
      return new Intl.DateTimeFormat(this.locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(d);
    }
    const date = new Intl.DateTimeFormat('bn-BD', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    const h = d.getHours();
    const part = h >= 4 && h < 12 ? 'সকাল' : h >= 12 && h < 15 ? 'দুপুর' : h >= 15 && h < 18 ? 'বিকাল' : h >= 18 && h < 20 ? 'সন্ধ্যা' : 'রাত';
    const minutes = new Intl.NumberFormat('bn-BD', { minimumIntegerDigits: 2 }).format(d.getMinutes());
    return `${date}, ${part} ${this.num(h % 12 || 12)}:${minutes}`;
  }

  /** "৫ ঘণ্টার মধ্যে" / "২ দিন পর" / "সময় পেরিয়ে গেছে" — how long is left. */
  timeLeft(r: BloodRequest): string {
    const hours = (new Date(r.neededBy).getTime() - Date.now()) / 3600e3;
    if (hours < 0) return this.lang.translate('bloodRequests.leftOverdue');
    if (hours < 1) return this.lang.translate('bloodRequests.leftUnderHour');
    if (hours < 24) return this.lang.translate('bloodRequests.leftHours').replace('{n}', this.num(Math.ceil(hours)));
    return this.lang.translate('bloodRequests.leftDays').replace('{n}', this.num(Math.round(hours / 24)));
  }

  /** A batch year without a thousands separator (২০১২, not ২,০১২). */
  year(n: number): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: false }).format(n);
  }

  /** The groups a donor of `group` can give to, for the side panel. */
  givesTo(group: BloodGroup): string {
    const to = CAN_GIVE_TO[group];
    return to.length === BLOOD_GROUPS.length ? this.lang.translate('bloodRequests.compatEveryone') : to.join(', ');
  }

  /** Needed within 24 hours (or overdue). */
  isUrgent(r: BloodRequest): boolean {
    return r.status === 'Open' && new Date(r.neededBy).getTime() - Date.now() < 24 * 3600 * 1000;
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.locale).format(n);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  private error(key: string): void {
    this.snackbar.showError(this.lang.translate(key));
  }
}
