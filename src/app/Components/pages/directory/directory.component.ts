import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MemberCreateDto, MemberService } from '../../../Services/member.service';
@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule, MatTabsModule],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss'
})
export class DirectoryComponent implements OnInit {
  memberList: MemberCreateDto[] = [];

  constructor(private memberService: MemberService) {}

  ngOnInit() {
    this.memberService.getMembers().subscribe({
      next: (members) => this.memberList = members,
      error: (err) => console.error('Failed to fetch members', err)
    });
  }
}