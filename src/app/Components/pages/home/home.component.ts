import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { Chart, registerables } from 'chart.js/auto';
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, MatDividerModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  // @ViewChild('memberGrowthChart') memberGrowthChart!: ElementRef<HTMLCanvasElement>;
  // @ViewChild('donationChart') donationChart!: ElementRef<HTMLCanvasElement>;

  // ngAfterViewInit() {
  //   // Member Growth Chart
  //   new Chart(this.memberGrowthChart.nativeElement, {
  //     type: 'line',
  //     data: {
  //       labels: ['2025'],
  //       datasets: [{
  //         label: 'সদস্য সংখ্যা',
  //         data: [170],
  //         borderColor: '#3949ab',
  //         backgroundColor: 'rgba(57,73,171,0.2)',
  //         tension: 0.3,
  //         fill: true
  //       }]
  //     },
  //     options: { responsive: true }
  //   });

  //   // Donation Chart
  //   new Chart(this.donationChart.nativeElement, {
  //     type: 'bar',
  //     data: {
  //       labels: ['2025'],
  //       datasets: [{
  //         label: 'দান (৳)',
  //         data: [31000],
  //         backgroundColor: '#1a237e'
  //       }]
  //     },
  //     options: { responsive: true }
  //   });
  // }
}
