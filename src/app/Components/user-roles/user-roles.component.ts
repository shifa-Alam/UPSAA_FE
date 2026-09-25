import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ConfirmService } from '../../Services/confirm.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime, finalize } from 'rxjs';
import { UserRoleService, UserRoleItem } from '../../Services/user-role.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { LanguageService } from '../../Services/language.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

const PAGE_SIZE = 20;
/** Display order, most privileged first; any other role the server returns goes last. */
const ROLE_ORDER = ['SuperAdmin', 'Admin', 'Representative', 'Member'];

/** SuperAdmin only: every login account, with a per-row role picker. */
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, FormsModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, TranslatePipe],
  templateUrl: './user-roles.component.html',
  styleUrl: './user-roles.component.scss'
})
export class UserRolesComponent implements OnInit, OnDestroy {
  private confirmService = inject(ConfirmService);
  users: UserRoleItem[] = [];
  roles: string[] = ROLE_ORDER;
  totalItems = 0;
  pageNumber = 1;
  readonly pageSize = PAGE_SIZE;

  search = '';
  roleFilter = '';
  loading = true;
  loadFailed = false;

  /** Role picked in each row's select but not saved yet, keyed by userId. */
  pending: Record<string, string> = {};
  savingId: string | null = null;

  private search$ = new Subject<void>();
  private sub?: Subscription;

  constructor(
    private userRoleService: UserRoleService,
    private snackbar: SnackbarService,
    private lang: LanguageService
  ) { }

  ngOnInit(): void {
    this.userRoleService.getRoles().subscribe({
      next: roles => this.roles = [...roles].sort((a, b) => this.rank(a) - this.rank(b)),
      error: () => { /* keep the built-in list */ }
    });
    this.sub = this.search$.pipe(debounceTime(300)).subscribe(() => { this.pageNumber = 1; this.load(); });
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onRoleFilterChange(): void {
    this.pageNumber = 1;
    this.load();
  }

  resetFilters(): void {
    this.search = '';
    this.roleFilter = '';
    this.pageNumber = 1;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.userRoleService.getUsers({ search: this.search, role: this.roleFilter, pageNumber: this.pageNumber, pageSize: this.pageSize })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: res => {
          this.loadFailed = false;
          this.users = res.users;
          this.totalItems = res.totalItems;
          this.pending = {};
        },
        error: () => {
          this.loadFailed = true;
          this.users = [];
          this.totalItems = 0;
        }
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageNumber) return;
    this.pageNumber = page;
    this.load();
  }

  selectedRole(u: UserRoleItem): string {
    return this.pending[u.userId] ?? u.role ?? '';
  }

  pick(u: UserRoleItem, role: string): void {
    if (role === u.role) delete this.pending[u.userId];
    else this.pending[u.userId] = role;
  }

  isDirty(u: UserRoleItem): boolean {
    return this.pending[u.userId] !== undefined;
  }

  save(u: UserRoleItem): void {
    const role = this.pending[u.userId];
    if (!role || this.savingId) return;

    const name = u.memberName || u.email || u.phone || '';
    const question = this.lang.translate('userRoles.confirmChange')
      .replace('{name}', name)
      .replace('{role}', this.lang.translate(this.roleKey(role)));
    this.confirmService.ask({ message: question }).subscribe(ok => {
      if (!ok) return;

      this.savingId = u.userId;
      this.userRoleService.changeRole(u.userId, role).pipe(finalize(() => this.savingId = null)).subscribe({
        next: res => {
          u.role = res.role;
          delete this.pending[u.userId];
          this.snackbar.showSuccess(this.lang.translate('userRoles.changeSuccess'));
        },
        error: err => {
          this.snackbar.showError(err?.error?.message || this.lang.translate('userRoles.changeFailed'));
        }
      });
    });
  }

  cancel(u: UserRoleItem): void {
    delete this.pending[u.userId];
  }

  roleKey(role: string | null): string {
    switch (role) {
      case 'SuperAdmin': return 'dashboard.roleSuperAdmin';
      case 'Admin': return 'dashboard.roleAdmin';
      case 'Representative': return 'dashboard.roleRepresentative';
      case 'Member': return 'dashboard.roleMember';
      default: return 'userRoles.noRole';
    }
  }

  roleClass(role: string | null): string {
    switch (role) {
      case 'SuperAdmin': return 'pill--gold';
      case 'Admin': return 'pill--navy';
      case 'Representative': return 'pill--info';
      case 'Member': return 'pill--neutral';
      default: return 'pill--danger';
    }
  }

  initials(u: UserRoleItem): string {
    const name = u.memberName || u.email || '?';
    return name.trim().charAt(0).toUpperCase();
  }

  formatNumber(n: number, plain = false): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: !plain }).format(n);
  }

  private rank(role: string): number {
    const i = ROLE_ORDER.indexOf(role);
    return i === -1 ? ROLE_ORDER.length : i;
  }
}
