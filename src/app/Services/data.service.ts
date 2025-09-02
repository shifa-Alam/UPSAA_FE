import { Injectable } from '@angular/core';
import { FeeType, MemberCreateDto } from './member.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _memberData: MemberCreateDto | undefined | null = null;

  setMemberData(data: MemberCreateDto) {
    this._memberData = data;
  }

  getMemberData() {
    const data = this._memberData;
    this._memberData = null; // optional: clear after use
    return data;
  }
}