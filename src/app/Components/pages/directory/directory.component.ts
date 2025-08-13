import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MemberCreateDto, MemberService } from '../../../Services/member.service';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss'
})
export class DirectoryComponent implements OnInit {
  memberList: MemberCreateDto[] = [];
  isLoading = true; // Loader flag

  constructor(private memberService: MemberService) {}

  ngOnInit() {
    this.isLoading = true;
    this.memberService.getMembers().subscribe({
      next: (members) => {
        this.memberList = members;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch members', err);
        this.isLoading = false;
      }
    });
  }
}
