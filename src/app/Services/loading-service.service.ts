import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable();

  show() {
    setTimeout(() => this._loading.next(true));  // avoids NG0100
  }

  hide() {
    setTimeout(() => this._loading.next(false));
  }
}
