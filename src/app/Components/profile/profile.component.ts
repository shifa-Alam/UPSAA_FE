import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member, MemberService } from '../../Services/member.service';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatIcon } from "@angular/material/icon";
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { MatTabsModule } from "@angular/material/tabs";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ImageCropperModule, MatIcon, MatTabsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  upsaaSpans: { rotate: string; size: number }[] = [];
  constructor(private memberService: MemberService, private dialog: MatDialog) { }

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
    this.memberService.getProfile().subscribe({
      next: res => {
        this.profileImageUrl = res?.photo ? res.photo + '?t=' + new Date().getTime() : '';
        this.member = res;
      },
      error: () => {
        this.profileImageUrl = '';
      }
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
        alert('Profile image updated successfully!');
      },
      error: () => {
        alert('Failed to upload image.');
        this.uploading = false;
      }
    });
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordComponent, {
      width: '90%'
    });
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
