import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule, MatTabsModule],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss'
})
export class DirectoryComponent {
  columns: string[] = ['name', 'designation', 'email', 'year', 'city'];
  advisorList = Array(10).fill({
    name: 'Hasib Al Ahmed',
    imageName: 'tuhin',
    designation: '(সদস্য সচিব)',
    comDesignation: 'Manager, RFL Electronics Ltd',
    email: 'Tuhin@ups.org',
    year: 'Batch 2009',
    city: 'Narsingdi'
  });
  memberList = [
    {
      name: 'Washim Mia',
      imageName: 'washimBhai',
      designation: '(আহবায়ক )',
      comDesignation: 'Auditor, SMS Bangladesh.',
      email: 'washim@ups.org',
      year: 'Batch 2007',
      city: 'Uttara,Dhaka'
    },
    {
      name: 'Hasib Al Ahmed',
      imageName: 'tuhin',
      designation: '(সদস্য সচিব)',
      comDesignation: 'Manager, RFL Electronics Ltd.',
      email: 'Tuhin@ups.org',
      year: 'Batch 2009',
      city: 'Narsingdi'
    },
    {
      name: 'Emran Hasan Rabbi',
      imageName: 'emran',
      designation: '(যুগ্ন আহবায়ক-১)',
      comDesignation: 'গণ মাধ্যমকর্মী',
      email: 'Emran@ups.org',
      year: 'Batch 2009',
      city: 'Mymensingh'
    }];
}
