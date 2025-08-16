import { Injectable } from '@angular/core';
import { FeeType, MemberCreateDto } from './member.service';
const dummyMember: MemberCreateDto = {
 
  fullName: 'John Doe',
  bloodGroup: 'O+',
  gender: 'Male',
  email: 'john.doe@example.com',
  phone: '1234567890',
  batch: 2010,
  currentDesignation: 'Software Engineer',
  employer: 'Tech Corp',
  currentCity: 'Dhaka',
  dob: '1990-05-15',
  educationRecords: [
    {
      degreeName: 'SSC', instituteName: 'ABC High School', subject: "abc",
      degreeId: 0,
      isCompleted: false
    },
    {
      degreeName: 'SSC', instituteName: 'ABC High School', subject: "abc",
      degreeId: 0,
      isCompleted: false
    }
  ],
  fees: [
    {
      feeType: FeeType.Membership, amount: 100,
      isPaid: false
    },
    {
      feeType: FeeType.Annual, amount: 300,
      isPaid: false
    }
    ,
    {
      feeType: FeeType.Donation, amount: 4500,
      isPaid: false
    }
  ]
};
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