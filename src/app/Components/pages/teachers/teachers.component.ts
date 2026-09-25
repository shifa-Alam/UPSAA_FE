import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { TeacherService, Teacher, TeacherStatus } from '../../../Services/teacher.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

interface TeacherGroup {
  status: TeacherStatus;
  eyebrowKey: string;
  titleKey: string;
  teachers: Teacher[];
}

const GROUP_ORDER: { status: TeacherStatus; key: string }[] = [
  { status: 'Current', key: 'current' },
  { status: 'Former', key: 'former' },
  { status: 'Retired', key: 'retired' },
];

import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, MatIconModule, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.scss'
})
export class TeachersComponent implements OnInit {
  allTeachers: Teacher[] = [];
  teachers: Teacher[] = [];
  /** The filtered list split into one portrait section per status. */
  groups: TeacherGroup[] = [];
  loading = true;
  loadError = false;

  activeFilter: TeacherStatus | '' = '';

  constructor(private teacherService: TeacherService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.teacherService.getAll().pipe(
      catchError(() => of(null))
    ).subscribe(teachers => {
      this.loading = false;

      if (!teachers) {
        this.loadError = true;
        return;
      }

      this.allTeachers = teachers;
      this.applyFilter();
    });
  }

  filterBy(status: TeacherStatus | ''): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  /** "1998 – 2015" / "২০১০ – বর্তমান", in the page's digits. */
  servicePeriod(t: Teacher): string {
    if (!t.serviceStartYear) return '';
    const end = t.serviceEndYear ? this.formatYear(t.serviceEndYear) : this.languageService.translate('teachers.present');
    return `${this.formatYear(t.serviceStartYear)} – ${end}`;
  }

  private formatYear(year: number): string {
    const locale = this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: false }).format(year);
  }

  private applyFilter(): void {
    this.teachers = this.activeFilter
      ? this.allTeachers.filter(t => t.status === this.activeFilter)
      : this.allTeachers;

    this.groups = GROUP_ORDER
      .map(g => ({
        status: g.status,
        eyebrowKey: `teachers.groups.${g.key}Eyebrow`,
        titleKey: `teachers.groups.${g.key}`,
        teachers: this.teachers.filter(t => t.status === g.status),
      }))
      .filter(g => g.teachers.length > 0);
  }
}
