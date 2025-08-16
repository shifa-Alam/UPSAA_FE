import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import confetti from 'canvas-confetti';
import { MatButtonModule } from '@angular/material/button';
import { DataService } from '../../Services/data.service';
import { MatCardModule } from '@angular/material/card';
import { MemberCreateDto, MemberFeeDto } from '../../Services/member.service';

@Component({
  selector: 'app-congratulations',
  standalone: true,
  imports: [CommonModule, MatButtonModule,MatCardModule],
  templateUrl: './congratulations.component.html',
  styleUrls: ['./congratulations.component.scss']
})
export class CongratulationsComponent implements OnInit {

  data: MemberCreateDto | undefined |null

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
     this.data = this.dataService.getMemberData();

    // Only launch confetti if running in browser
    if (isPlatformBrowser(this.platformId)) {
      this.launchConfetti();
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
// ✅ Method to calculate total fees
  calculateTotalFees(): number {
    if (!this.data?.fees || this.data.fees.length === 0) {
      return 0;
    }
    return this.data.fees.reduce((sum: number, fee: MemberFeeDto) => sum + fee.amount, 0);
  }
  private launchConfetti() {
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: Math.random() * 360,
        spread: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#00bcd4', '#ff4081', '#ffc107', '#4caf50']
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
