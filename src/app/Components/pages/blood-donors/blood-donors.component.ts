import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { MemberService, BloodDonor } from '../../../Services/member.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { LanguageService } from '../../../Services/language.service';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

@Component({
  selector: 'app-blood-donors',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeaderComponent, EmptyStateComponent, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './blood-donors.component.html',
  styleUrl: './blood-donors.component.scss'
})
export class BloodDonorsComponent implements OnInit {
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  donors: BloodDonor[] = [];
  loading = true;
  loadError = false;

  filters = {
    bloodGroup: '',
    city: '',
  };

  private refresh$ = new Subject<void>();

  constructor(private memberService: MemberService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.refresh$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading = true;
        this.loadError = false;
        return this.memberService.getBloodDonors(this.filters.bloodGroup || undefined, this.filters.city.trim() || undefined)
          .pipe(catchError(() => of(null)));
      })
    ).subscribe(donors => {
      this.loading = false;
      if (!donors) {
        this.loadError = true;
        this.donors = [];
        return;
      }
      this.donors = donors;
    });

    this.refresh$.next();
  }

  onFilterChange(): void {
    this.refresh$.next();
  }

  /** Chip click — picking the active group again clears it back to "all". */
  selectGroup(group: string): void {
    this.filters.bloodGroup = this.filters.bloodGroup === group ? '' : group;
    this.onFilterChange();
  }

  resetFilters(): void {
    this.filters = { bloodGroup: '', city: '' };
    this.onFilterChange();
  }

  /** Locale digits (Bangla numerals in bn); `plain` drops grouping for years. */
  num(value: number, plain = false): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: !plain }).format(value);
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
