import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

/** Dragged this far down (px), or flicked this fast (px/ms), the sheet closes. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.6;
/** A drag only starts from the top strip (grab handle), or anywhere once the content is scrolled to its top. */
const HANDLE_HEIGHT = 56;

/**
 * On phones every Material dialog is a bottom sheet (styles.scss, "Bottom sheets"),
 * and this lets people pull it down to dismiss — the gesture native apps teach.
 * Hooks MatDialog globally, so no dialog needs its own code. Dialogs opened with
 * disableClose ignore the gesture.
 */
@Injectable({ providedIn: 'root' })
export class SheetGestureService {
  private readonly dialog = inject(MatDialog);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  init(): void {
    if (!this.isBrowser) return;
    this.dialog.afterOpened.subscribe(ref => {
      if (!window.matchMedia('(max-width: 600px)').matches || ref.disableClose) return;
      // The container is in the DOM once afterOpened fires.
      setTimeout(() => this.attach(ref));
    });
  }

  private attach(ref: MatDialogRef<unknown>): void {
    const container = document.getElementById(ref.id);
    const surface = container?.querySelector<HTMLElement>('.mat-mdc-dialog-surface');
    if (!surface) return;

    let startY = 0, startT = 0, dy = 0, dragging = false;

    const scrolledToTop = (target: EventTarget | null) => {
      let el = target as HTMLElement | null;
      while (el && el !== surface) {
        if (el.scrollHeight > el.clientHeight && el.scrollTop > 0) return false;
        el = el.parentElement;
      }
      return surface.scrollTop <= 0;
    };

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const fromHandle = touch.clientY - surface.getBoundingClientRect().top < HANDLE_HEIGHT;
      dragging = fromHandle || scrolledToTop(e.target);
      startY = touch.clientY; startT = e.timeStamp; dy = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      if (dy > 0) {
        if (e.cancelable) e.preventDefault(); // pulling the sheet, not scrolling the page behind
        surface.style.transition = 'none';
        surface.style.transform = `translateY(${dy}px)`;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      const velocity = dy / Math.max(1, e.timeStamp - startT);
      surface.style.transition = '';
      if (dy > CLOSE_DISTANCE || (dy > 30 && velocity > CLOSE_VELOCITY)) {
        surface.style.transform = 'translateY(100%)';
        this.zone.run(() => ref.close());
      } else {
        surface.style.transform = '';
      }
    };

    this.zone.runOutsideAngular(() => {
      surface.addEventListener('touchstart', onStart, { passive: true });
      surface.addEventListener('touchmove', onMove, { passive: false });
      surface.addEventListener('touchend', onEnd, { passive: true });
      surface.addEventListener('touchcancel', onEnd, { passive: true });
    });
  }
}
