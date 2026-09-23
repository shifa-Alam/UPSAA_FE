import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ConstitutionService, ConstitutionDocument } from '../../../Services/constitution.service';
import { LanguageService } from '../../../Services/language.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

@Component({
  selector: 'app-constitution',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe],
  templateUrl: './constitution.component.html',
  styleUrl: './constitution.component.scss'
})
export class ConstitutionComponent implements OnInit {
  /** The PDF an admin uploaded from /dashboard/constitution; null until one exists. */
  document: ConstitutionDocument | null = null;
  loading = true;

  constructor(
    private constitutionService: ConstitutionService,
    private lang: LanguageService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit(): void {
    // Any failure (not uploaded yet, endpoint missing) falls back to the "coming soon" state.
    this.constitutionService.getCurrent().pipe(catchError(() => of(null))).subscribe(doc => {
      this.loading = false;
      this.document = doc?.fileUrl ? doc : null;
    });
  }

  open(doc: ConstitutionDocument, mode: 'view' | 'download'): void {
    this.constitutionService.open(doc, mode, () =>
      this.snackbar.showError(this.lang.translate('constitution.document.openFailed')));
  }

  updatedOn(doc: ConstitutionDocument): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(doc.uploadedAt));
  }
}
