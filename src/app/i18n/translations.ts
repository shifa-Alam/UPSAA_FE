import { Dict, Lang } from './i18n.types';
import { navI18n } from './sections/nav.i18n';
import { footerI18n } from './sections/footer.i18n';
import { homeI18n } from './sections/home.i18n';
import { aboutI18n } from './sections/about.i18n';
import { directoryI18n } from './sections/directory.i18n';
import { eventsI18n } from './sections/events.i18n';
import { contactI18n } from './sections/contact.i18n';
import { committeeI18n } from './sections/committee.i18n';
import { constitutionI18n } from './sections/constitution.i18n';
import { galleryI18n } from './sections/gallery.i18n';
import { loginI18n } from './sections/login.i18n';
import { forgetPasswordI18n } from './sections/forgetPassword.i18n';
import { resetPasswordI18n } from './sections/resetPassword.i18n';
import { unauthorizedI18n } from './sections/unauthorized.i18n';
import { changePasswordI18n } from './sections/changePassword.i18n';
import { registerI18n } from './sections/register.i18n';
import { profileI18n } from './sections/profile.i18n';
import { memberLandingI18n } from './sections/memberLanding.i18n';
import { memberDetailsI18n } from './sections/memberDetails.i18n';
import { memberEditI18n } from './sections/memberEdit.i18n';
import { nominationI18n } from './sections/nomination.i18n';
import { votingScreenI18n } from './sections/votingScreen.i18n';
import { voteCardI18n } from './sections/voteCard.i18n';
import { congratulationsI18n } from './sections/congratulations.i18n';
import { dashboardI18n } from './sections/dashboard.i18n';
import { electionsI18n } from './sections/elections.i18n';
import { positionsI18n } from './sections/positions.i18n';
import { candidatesI18n } from './sections/candidates.i18n';
import { candidateAddI18n } from './sections/candidateAdd.i18n';
import { voteCastsI18n } from './sections/voteCasts.i18n';
import { galleryAdminI18n } from './sections/galleryAdmin.i18n';
import { financeLedgerI18n } from './sections/financeLedger.i18n';
import { noticeAdminI18n } from './sections/noticeAdmin.i18n';
import { birthdayAutomationI18n } from './sections/birthdayAutomation.i18n';
import { batchesI18n } from './sections/batches.i18n';
import { achievementAdminI18n } from './sections/achievementAdmin.i18n';
import { achievementsI18n } from './sections/achievements.i18n';
import { teacherAdminI18n } from './sections/teacherAdmin.i18n';
import { teachersI18n } from './sections/teachers.i18n';
import { eventAdminI18n } from './sections/eventAdmin.i18n';
import { bloodDonorsI18n } from './sections/bloodDonors.i18n';
import { jobsI18n } from './sections/jobs.i18n';
import { memberDashboardI18n } from './sections/memberDashboard.i18n';
import { adminWelcomeI18n } from './sections/adminWelcome.i18n';
import { constitutionAdminI18n } from './sections/constitutionAdmin.i18n';
import { userRolesI18n } from './sections/userRoles.i18n';

// Every entry here is a section file's export. Each one owns a single,
// unique top-level namespace key (see i18n.types.ts) — that's what makes
// this a plain shallow merge instead of a deep merge: as long as no two
// sections claim the same top-level key, order never matters and nobody's
// keys can silently clobber anybody else's.
const sections = [
  navI18n,
  footerI18n,
  homeI18n,
  aboutI18n,
  directoryI18n,
  eventsI18n,
  contactI18n,
  committeeI18n,
  constitutionI18n,
  galleryI18n,
  loginI18n,
  forgetPasswordI18n,
  resetPasswordI18n,
  unauthorizedI18n,
  changePasswordI18n,
  registerI18n,
  profileI18n,
  memberLandingI18n,
  memberDetailsI18n,
  memberEditI18n,
  nominationI18n,
  votingScreenI18n,
  voteCardI18n,
  congratulationsI18n,
  dashboardI18n,
  electionsI18n,
  positionsI18n,
  candidatesI18n,
  candidateAddI18n,
  voteCastsI18n,
  galleryAdminI18n,
  financeLedgerI18n,
  noticeAdminI18n,
  birthdayAutomationI18n,
  batchesI18n,
  achievementAdminI18n,
  achievementsI18n,
  teacherAdminI18n,
  teachersI18n,
  eventAdminI18n,
  bloodDonorsI18n,
  jobsI18n,
  memberDashboardI18n,
  adminWelcomeI18n,
  constitutionAdminI18n,
  userRolesI18n,
];

function mergeLang(lang: Lang): Dict {
  return sections.reduce<Dict>((acc, section) => ({ ...acc, ...section[lang] }), {});
}

export const translations: Record<Lang, Dict> = {
  bn: mergeLang('bn'),
  en: mergeLang('en'),
};
