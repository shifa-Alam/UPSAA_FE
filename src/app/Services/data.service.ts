import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _memberData: any;

  setMemberData(data: any) {
    this._memberData = data;
  }

  getMemberData() {
    const data = this._memberData;
    this._memberData = null; // optional: clear after use
    return data;
  }
}