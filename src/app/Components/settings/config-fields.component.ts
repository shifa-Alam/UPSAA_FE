import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppConfigGroup, AppConfigItem, AppConfigService } from '../../Services/app-config.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';

/**
 * One group of system settings kept in the database (SMTP, SMS gateway, general), as a card
 * with its own Save. Each field says where its value comes from — saved here, the server's
 * config file, or nowhere — and a saved one can be handed back to the file. Secrets are
 * write-only: blank keeps the saved one. SuperAdmin only (the API enforces it too).
 */
@Component({
  selector: 'app-config-fields',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe, SectionCardComponent, SkeletonComponent],
  templateUrl: './config-fields.component.html',
  styleUrl: './config-fields.component.scss'
})
export class ConfigFieldsComponent implements OnInit {
  @Input({ required: true }) group!: AppConfigGroup;
  @Input() icon = 'tune';
  @Input() titleKey = '';
  @Input() hintKey = '';
  /** After a save — so the page can refresh what depends on these values. */
  @Output() saved = new EventEmitter<void>();

  private api = inject(AppConfigService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  items: AppConfigItem[] = [];
  /** What's typed, by key ("true"/"false" for switches). */
  draft: Record<string, string> = {};
  /** Keys to hand back to the config file on the next save. */
  reset = new Set<string>();
  loading = true;
  saving = false;

  ngOnInit(): void {
    this.api.get(this.group).subscribe({
      next: items => this.apply(items),
      error: () => { this.loading = false; this.snackbar.showError(this.lang.translate('appConfig.loadFailed')); }
    });
  }

  label(item: AppConfigItem): string {
    return this.lang.translate('appConfig.field.' + item.key.replace(':', '_'));
  }

  hint(item: AppConfigItem): string {
    const key = 'appConfig.hint.' + item.key.replace(':', '_');
    const text = this.lang.translate(key);
    return text === key ? '' : text;
  }

  sourceKey(item: AppConfigItem): string {
    return this.reset.has(item.key) ? 'appConfig.sourceResetting' : 'appConfig.source_' + item.source;
  }

  toggleReset(item: AppConfigItem): void {
    if (this.reset.has(item.key)) this.reset.delete(item.key);
    else this.reset.add(item.key);
  }

  get dirty(): boolean {
    return this.reset.size > 0 || this.items.some(i => this.changed(i));
  }

  save(): void {
    if (this.saving || !this.dirty) return;
    const values: Record<string, string> = {};
    for (const item of this.items) {
      if (this.reset.has(item.key) || !this.changed(item)) continue;
      values[item.key] = this.draft[item.key] ?? '';
    }
    this.saving = true;
    this.api.save(values, [...this.reset]).subscribe({
      next: items => {
        this.saving = false;
        this.apply(items.filter(i => i.group === this.group));
        this.snackbar.showSuccess(this.lang.translate('appConfig.saved'));
        this.saved.emit();
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message || this.lang.translate('appConfig.saveFailed'));
      }
    });
  }

  private changed(item: AppConfigItem): boolean {
    const now = this.draft[item.key] ?? '';
    if (item.isSecret) return now.trim().length > 0;
    return now.trim() !== (item.kind === 'bool' ? String((item.value ?? '').toLowerCase() === 'true') : (item.value ?? '')).trim();
  }

  private apply(items: AppConfigItem[]): void {
    this.items = items;
    this.reset.clear();
    this.draft = {};
    for (const i of items)
      this.draft[i.key] = i.isSecret ? '' : i.kind === 'bool' ? String((i.value ?? '').toLowerCase() === 'true') : (i.value ?? '');
    this.loading = false;
  }
}
