import { Member } from '../Services/member.service';

/** Only fields members can fill in themselves (edit dialog, photo upload, education). */
const PROFILE_CHECKS: { key: string; filled: (m: Member) => boolean }[] = [
  { key: 'photo', filled: m => !!m.photo },
  { key: 'phone', filled: m => !!m.phone?.trim() },
  { key: 'email', filled: m => !!m.email?.trim() },
  { key: 'bloodGroup', filled: m => !!m.bloodGroup?.trim() },
  { key: 'currentCity', filled: m => !!m.currentCity?.trim() },
  { key: 'currentDesignation', filled: m => !!m.currentDesignation?.trim() },
  { key: 'employer', filled: m => !!m.employer?.trim() },
  { key: 'education', filled: m => (m.educationRecords?.length ?? 0) > 0 },
];

/** Keys (e.g. 'bloodGroup') of the profile fields that are still empty. */
export function missingProfileFields(member: Member): string[] {
  return PROFILE_CHECKS.filter(c => !c.filled(member)).map(c => c.key);
}

/** 0–100, rounded. */
export function profileCompletion(member: Member): number {
  const done = PROFILE_CHECKS.length - missingProfileFields(member).length;
  return Math.round((done / PROFILE_CHECKS.length) * 100);
}
