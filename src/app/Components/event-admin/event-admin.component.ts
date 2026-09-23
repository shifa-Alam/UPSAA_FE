import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import { EventService, EventItem, EventSave } from '../../Services/event.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';

type EventStatus = 'upcoming' | 'ongoing' | 'ended';

const emptyForm = (): EventSave => ({
  title: '', description: '', eventDate: '', endDate: null, venue: '', organizerName: '', registrationUrl: ''
});

@Component({
  selector: 'app-event-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './event-admin.component.html',
  styleUrl: './event-admin.component.scss'
})
export class EventAdminComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  loading = true;
  events: EventItem[] = [];
  pagedEvents: EventItem[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  showForm = false;
  editMode = false;
  editingId: number | null = null;
  form: EventSave = emptyForm();
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  saving = false;

  deletingId: number | null = null;

  constructor(
    private eventService: EventService,
    private snackbar: SnackbarService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;

    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = file ? URL.createObjectURL(file) : null;
  }

  filterEvents(): void {
    this.currentPage = 1;
    this.calculatePages();
  }

  eventStatus(ev: EventItem): EventStatus {
    const now = new Date();
    const start = new Date(ev.eventDate);
    const end = ev.endDate ? new Date(ev.endDate) : start;
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'ongoing';
  }

  // ---- Display helpers for the date tile / meta line (locale follows the UI language) ----
  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  eventDay(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { day: '2-digit' }).format(new Date(ev.eventDate));
  }

  eventMonth(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { month: 'short' }).format(new Date(ev.eventDate));
  }

  eventWhen(ev: EventItem): string {
    const d = new Date(ev.eventDate);
    const date = new Intl.DateTimeFormat(this.locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat(this.locale, { hour: 'numeric', minute: '2-digit' }).format(d);
    return `${date} · ${time}`;
  }

  openAddForm(): void {
    this.editMode = false;
    this.editingId = null;
    this.form = emptyForm();
    this.resetPhoto();
    this.showForm = true;
  }

  startEdit(ev: EventItem): void {
    this.editMode = true;
    this.editingId = ev.id;
    this.form = {
      title: ev.title,
      description: ev.description ?? '',
      eventDate: this.toLocalInput(ev.eventDate),
      endDate: ev.endDate ? this.toLocalInput(ev.endDate) : null,
      venue: ev.venue ?? '',
      organizerName: ev.organizerName ?? '',
      registrationUrl: ev.registrationUrl ?? ''
    };
    this.resetPhoto();
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetPhoto();
  }

  submit(): void {
    if (!this.form.title.trim() || !this.form.eventDate) {
      this.snackbar.showError(this.languageService.translate('eventAdmin.requiredError'));
      return;
    }

    this.saving = true;
    const request = this.editMode && this.editingId != null
      ? this.eventService.update(this.editingId, this.form, this.selectedFile)
      : this.eventService.create(this.form, this.selectedFile);

    request.pipe(
      catchError(err => {
        this.snackbar.showError(err?.error?.message || this.languageService.translate('eventAdmin.saveFailedError'));
        return of(null);
      })
    ).subscribe(result => {
      this.saving = false;
      if (!result) return;

      if (this.editMode) {
        const index = this.events.findIndex(e => e.id === result.id);
        if (index !== -1) this.events[index] = result;
        this.snackbar.showSuccess(this.languageService.translate('eventAdmin.editSuccess'));
      } else {
        this.events.unshift(result);
        this.snackbar.showSuccess(this.languageService.translate('eventAdmin.postSuccess'));
      }

      this.calculatePages();
      this.cancelForm();
    });
  }

  confirmDelete(ev: EventItem): void {
    this.confirmService.askDelete(ev.title, this.languageService.translate('eventAdmin.deleteConfirm')).subscribe(ok => {
      if (!ok) return;

      this.deletingId = ev.id;
      this.eventService.delete(ev.id).pipe(finalize(() => this.deletingId = null)).subscribe({
        next: () => {
          this.events = this.events.filter(e => e.id !== ev.id);
          this.calculatePages();
          this.snackbar.showSuccess(this.languageService.translate('eventAdmin.deleteSuccess'));
        },
        error: () => this.snackbar.showError(this.languageService.translate('eventAdmin.deleteFailedError'))
      });
    });
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.calculatePages();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.calculatePages();
    }
  }

  private calculatePages(): void {
    const filtered = this.events.filter(e => e.title.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.pagedEvents = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  private resetPhoto(): void {
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  private toLocalInput(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + d.getHours()).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private loadEvents(): void {
    this.loading = true;
    this.eventService.getAll().pipe(catchError(() => of([]))).subscribe(events => {
      this.loading = false;
      this.events = events;
      this.calculatePages();
    });
  }
}
