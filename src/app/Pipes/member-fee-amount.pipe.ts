import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'memberFeeAmount',
  standalone: true
})
export class MemberFeeAmountPipe implements PipeTransform {
  transform(fees: any[], type: 'Membership' | 'Donation' | 'Total'): number {
    if (!fees) return 0;

    if (type === 'Membership') return fees.filter(f => f.feeType === 'Membership').reduce((sum, f) => sum + f.amount, 0);
    if (type === 'Donation') return fees.filter(f => f.feeType === 'Donation').reduce((sum, f) => sum + f.amount, 0);
    if (type === 'Total') return fees.reduce((sum, f) => sum + f.amount, 0);

    return 0;
  }
}
