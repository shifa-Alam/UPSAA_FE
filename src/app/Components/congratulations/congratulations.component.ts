import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import confetti from 'canvas-confetti';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../Services/data.service';
import { MemberCreateDto, MemberFeeDto } from '../../Services/member.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';

@Component({
  selector: 'app-congratulations',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './congratulations.component.html',
  styleUrls: ['./congratulations.component.scss']
})
export class CongratulationsComponent implements OnInit {

  data: MemberCreateDto | undefined | null

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.data = this.dataService.getMemberData();

    // Only launch confetti in the browser, and never for reduced-motion users
    if (isPlatformBrowser(this.platformId) && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
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
        colors: ['#0b5ed7', '#22d3ee', '#c9a24a', '#f5a623']
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
