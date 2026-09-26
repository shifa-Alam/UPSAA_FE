import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ConfirmService } from '../../Services/confirm.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { CommonModule } from '@angular/common';
import { Member, MemberEducationDto, MemberService } from '../../Services/member.service';
import { profileCompletion } from '../../Utils/profile-completeness';

/** Seeded EducationDegrees rows (fixed ids) — same list the registration form uses. */
export const DEGREES = [
  { id: 1, key: 'ssc' }, { id: 2, key: 'hsc' }, { id: 3, key: 'diploma' }, { id: 4, key: 'bachelor' },
  { id: 5, key: 'masters' }, { id: 6, key: 'pgd' }, { id: 7, key: 'phd' },
];

interface EducationForm {
  id: number | null;
  degreeId: number | null;
  instituteName: string;
  subject: string;
  isCompleted: boolean;
}
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatIcon } from "@angular/material/icon";
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { MatTabsModule } from "@angular/material/tabs";
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MemberEditComponent } from '../member-edit/member-edit.component';
import { CandidateAddComponent } from '../candidate-add/candidate-add.component';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { LanguageService } from '../../Services/language.service';
import { SizedImagePipe, SizedSrcsetPipe } from '../../Pipes/sized-image.pipe';

import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { MemberCardComponent } from './member-card/member-card.component';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SkeletonComponent, MemberCardComponent, 
    RouterModule,// <-- Add here
    CommonModule,
    FormsModule,
    ImageCropperModule,
    MatIcon,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  private snackbar = inject(SnackbarService);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly degrees = DEGREES;
  /** Open while adding (id null) or editing (id set) an education record. */
  educationForm: EducationForm | null = null;
  savingEducation = false;
  deletingEducationId: number | null = null;
  savingPrivacy = false;

  get completion(): number {
    return this.member ? profileCompletion(this.member) : 0;
  }

  /** Highest degree first, for the timeline. */
  get sortedEducation(): MemberEducationDto[] {
    return [...(this.member?.educationRecords ?? [])].sort((a, b) => b.degreeId - a.degreeId);
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }

  formatPlain(value: number): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: false }).format(value);
  }

  togglePrivacy() {
    if (!this.member || this.savingPrivacy) return;
    const member = this.member;
    const next = !member.isSensitiveHidden;
    member.isSensitiveHidden = next; // flip now, roll back if the save fails
    this.savingPrivacy = true;
    this.memberService.setMyPrivacy(next).pipe(finalize(() => this.savingPrivacy = false)).subscribe({
      next: () => this.snackbar.showSuccess(this.languageService.translate(next ? 'profile.privacyOnSaved' : 'profile.privacyOffSaved')),
      error: () => {
        member.isSensitiveHidden = !next;
        this.snackbar.showError(this.languageService.translate('profile.privacySaveFailed'));
      }
    });
  }

  profileImageUrl: string = '';
  imageFile: File | null = null;
  croppedImage: string | null = '';
  uploading: boolean = false;
  imageChangedEvent: any;
  member: Member | undefined;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  passwordError = '';
  passwordSuccess = '';
  displayedColumns: string[] = ['degree', 'institute', 'subject', 'actions'];

  upsaaSpans: { rotate: string; size: number }[] = [];
  constructor(private memberService: MemberService, private dialog: MatDialog, private languageService: LanguageService) { }

  ngOnInit() {
    this.loadProfile();
    const count = 300; // number of UPSAA spans
    for (let i = 0; i < count; i++) {
      this.upsaaSpans.push({
        rotate: `${Math.floor(Math.random() * 60) - 30}deg`, // -30 to +30
        size: Math.floor(Math.random() * 20) + 14,           // 14px to 34px
      });
    }

  }
  profileFullName: string = ''; // fetched from API

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '';
  }
  loadProfile() {
    this.loading = true
    this.memberService.getProfile().subscribe({
      next: res => {
        this.profileImageUrl = res?.photo ? res.photo + '?t=' + new Date().getTime() : '';
        this.member = res;
      },
      error: () => {
        this.profileImageUrl = '';
      },
      complete: () => this.loading = false
    });
  }
  cancelCrop() {
    this.imageChangedEvent = null;
    this.croppedImage = null;

    // Reset file input value so same file can be selected again
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
  addEducation() {
    const used = new Set((this.member?.educationRecords ?? []).map((e: MemberEducationDto) => e.degreeId));
    const firstFree = DEGREES.find(d => !used.has(d.id))?.id ?? null;
    this.educationForm = { id: null, degreeId: firstFree, instituteName: '', subject: '', isCompleted: true };
  }

  /** Degrees the member doesn't have yet (plus the one being edited). */
  get availableDegrees() {
    const editing = this.educationForm?.id;
    const used = new Set((this.member?.educationRecords ?? [])
      .filter((e: MemberEducationDto) => e.id !== editing)
      .map((e: MemberEducationDto) => e.degreeId));
    return DEGREES.filter(d => !used.has(d.id));
  }

  cancelEducation() {
    this.educationForm = null;
  }

  saveEducation() {
    const form = this.educationForm;
    if (!form || this.savingEducation) return;
    const t = (k: string) => this.languageService.translate(k);
    if (!form.degreeId) {
      this.snackbar.showError(t('profile.degreeRequired'));
      return;
    }

    const dto: MemberEducationDto = {
      degreeId: form.degreeId,
      instituteName: form.instituteName.trim() || undefined,
      subject: form.subject.trim() || undefined,
      isCompleted: form.isCompleted
    };

    this.savingEducation = true;
    const request = form.id
      ? this.memberService.updateEducation(form.id, dto)
      : this.memberService.addEducation(dto);

    request.pipe(finalize(() => this.savingEducation = false)).subscribe({
      next: () => {
        this.snackbar.showSuccess(t(form.id ? 'profile.educationUpdated' : 'profile.educationAdded'));
        this.educationForm = null;
        this.loadProfile();
      },
      error: err => this.snackbar.showError(this.educationError(err))
    });
  }

  private educationError(err: any): string {
    const msg: string | undefined = err?.error?.message;
    if (msg?.includes('already exists')) return this.languageService.translate('profile.degreeDuplicate');
    return this.languageService.translate('profile.educationSaveFailed');
  }

  degreeLabel(degreeId: number, fallback?: string): string {
    const d = DEGREES.find(x => x.id === degreeId);
    return d ? this.languageService.translate(`profile.degrees.${d.key}`) : (fallback ?? '');
  }


  onFileSelected(event: Event) {

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageChangedEvent = event; // pass the actual event
    }
  }


  imageCropped(event: any) {
    const blob = event.blob;
    if (!blob) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.croppedImage = reader.result as string; // this is your base64 string
    };
    reader.readAsDataURL(blob);
  }


  uploadImage() {
    if (!this.croppedImage) return;

    this.uploading = true;
    const blob = this.dataURLtoBlob(this.croppedImage);
    const file = new File([blob], 'profile.png', { type: 'image/png' });

    this.memberService.uploadProfileImage(file).subscribe({
      next: res => {
        this.profileImageUrl = res.imageUrl + '?t=' + new Date().getTime(); // cache-busting
        this.croppedImage = '';
        this.imageFile = null;
        this.imageChangedEvent = null; // reset cropper
        this.uploading = false;
        alert(this.languageService.translate('profile.uploadSuccess'));
      },
      error: () => {
        alert(this.languageService.translate('profile.uploadError'));
        this.uploading = false;
      }
    });
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordComponent, {
      width: '440px'
    });
  }
  openEditInfoDialog() {
    const dialogRef = this.dialog.open(MemberEditComponent, {
      width: '720px',
      data: this.member, // pass current member data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result contains updated member info
        this.member = result;
        // call API to save changes
        // this.memberService.updateMember(result).subscribe({
        //   next: res => {

        //     this.uploading = false;

        //   },
        //   error: () => {

        //     this.uploading = false;
        //   }
        // });
      }
    });
  }
  editEducation(edu: MemberEducationDto) {
    this.educationForm = {
      id: edu.id ?? null,
      degreeId: edu.degreeId,
      instituteName: edu.instituteName ?? '',
      subject: edu.subject ?? '',
      isCompleted: edu.isCompleted
    };
  }

  deleteEducation(edu: MemberEducationDto) {
    if (!edu.id) return;
    const id = edu.id;
    const message = `${this.languageService.translate('profile.deleteEducationConfirmPrefix')} ${this.degreeLabel(edu.degreeId, edu.degreeName)}?`;
    this.confirmService.ask({ message, danger: true }).subscribe(ok => {
      if (!ok) return;
      this.deletingEducationId = id;
      this.memberService.deleteEducation(id).pipe(finalize(() => this.deletingEducationId = null)).subscribe({
        next: () => {
          if (this.educationForm?.id === id) this.educationForm = null;
          this.snackbar.showSuccess(this.languageService.translate('profile.educationDeleted'));
          this.loadProfile();
        },
        error: () => this.snackbar.showError(this.languageService.translate('profile.educationDeleteFailed'))
      });
    });
  }
  openCandidateForm() {
    // Option 1: open Angular Material dialog
    this.dialog.open(CandidateAddComponent, { width: '560px' });

    // Option 2: navigate to route
    // this.router.navigate(['/candidate-form', this.member.id]);

    console.log('Buy Nomination clicked');
  }

  private dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  }
}
