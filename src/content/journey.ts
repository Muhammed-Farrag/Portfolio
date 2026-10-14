// Scene 06, the Journey timeline. Statuses follow docs/CONTENT_APPROVAL.md: `pending` items are
// development-only (rendered through SHOW_PENDING) and never reach a release build.
import depiPhoto from '../assets/recognition/depi-2026.webp';
import beijingPhoto from '../assets/recognition/roborave-beijing-2025.webp';

export type Lane = 'education' | 'roles' | 'recognition';

export interface JourneyItem {
  id: string;
  lane: Lane;
  /** Sub-row inside the lane, so overlapping items do not collide. */
  row?: number;
  /** Decimal years: 2024.5 is the start of July 2024. `end` is exclusive. */
  start: number;
  end: number;
  short: string;
  title: string;
  org: string;
  when: string;
  text: string;
  source: string;
  status: 'verified' | 'cv-reported' | 'pending';
  photo?: { src: string; alt: string; width: number; height: number };
  /** A development-only note for a missing photo. */
  photoPending?: string;
  link?: { href: string; label: string };
}

const m = (year: number, month: number) => year + (month - 1) / 12;

export const AXIS = { from: 2022, to: 2027 };

export const LANES: { id: Lane; label: string }[] = [
  { id: 'education', label: 'Study' },
  { id: 'roles', label: 'Roles' },
  { id: 'recognition', label: 'Recognition' },
];

export const journey: JourneyItem[] = [
  {
    id: 'bsc', lane: 'education', start: 2022, end: 2027, short: 'B.Sc. AI Science',
    title: 'B.Sc. in Artificial Intelligence Science', org: 'Alamein International University', when: '2022–2026',
    text: 'The degree that runs underneath everything else on this page.', source: 'CV, profile README', status: 'verified',
  },
  {
    id: 'gci', lane: 'education', row: 1, start: 2026, end: 2027, short: 'GCI World',
    title: 'GCI World 2026', org: 'University of Tokyo', when: '2026',
    text: 'Participant in the GCI World 2026 programme.', source: 'CV', status: 'cv-reported',
  },
  {
    id: 'iti', lane: 'roles', start: m(2024, 7), end: m(2024, 9), short: 'ITI',
    title: 'Software Engineer Intern', org: 'ITI', when: 'Jul–Aug 2024',
    text: 'A summer software engineering internship.', source: 'CV, profile README', status: 'verified',
  },
  {
    id: 'stc', lane: 'roles', row: 1, start: m(2024, 7), end: m(2024, 9), short: 'STC',
    title: 'Intern (title to confirm)', org: 'STC', when: 'Jul–Aug 2024',
    text: 'The CV says Data Science Intern; the profile README says AI & Data Analytics Intern.', source: 'CV vs README', status: 'pending',
  },
  {
    id: 'depi-trainee', lane: 'roles', start: m(2025, 6), end: m(2026, 1), short: 'DEPI',
    title: 'Generative AI Professional Trainee', org: 'Digital Egypt Pioneers Initiative (DEPI)', when: 'Jun–Dec 2025',
    text: 'Generative AI professional training track.', source: 'CV', status: 'cv-reported',
  },
  {
    id: 'tjm', lane: 'roles', row: 1, start: m(2025, 10), end: m(2026, 1), short: 'TJM Labs',
    title: 'Software Developer (title to confirm)', org: 'TJM Labs', when: 'Oct–Dec 2025',
    text: 'CV title by default; the README says Software Engineer.', source: 'CV vs README', status: 'pending',
  },
  {
    id: 'cluster', lane: 'roles', start: m(2026, 7), end: m(2026, 9), short: 'Cluster',
    title: 'AI Operations Engineer (wording to confirm)', org: 'Cluster', when: 'Jul–Aug 2026',
    text: 'The CV and README describe different work.', source: 'CV vs README', status: 'pending',
  },
  {
    id: 'beijing', lane: 'recognition', start: m(2025, 8), end: m(2025, 9), short: 'Beijing',
    title: 'Best Creativity Trophy', org: 'RoboRAVE International Entrepreneurial Challenge · Beijing', when: 'Aug 2025',
    text: 'Competing with Montura on the international stage.', source: 'CV, profile README, photo', status: 'verified',
    photo: { src: beijingPhoto, alt: 'Muhammed Farrag on the RoboRAVE 2025 arena floor, wearing the Egyptian flag and holding a trophy.', width: 582, height: 805 },
    link: { href: '#recognition', label: 'See the moment' },
  },
  {
    id: 'depi-honoree', lane: 'recognition', row: 1, start: m(2026, 4), end: m(2026, 5), short: 'DEPI honoree',
    title: 'Top Digital Pioneer Honoree', org: 'Digital Egypt Pioneers Initiative (MCIT)', when: 'Apr 2026',
    text: 'Honoured at the Digital Egypt Pioneers ceremony.', source: 'CV, profile README, photo', status: 'verified',
    photo: { src: depiPhoto, alt: 'Muhammed Farrag at a Digital Egypt Pioneers ceremony, wearing a recognition sash and holding a certificate.', width: 722, height: 732 },
  },
  {
    id: 'judge', lane: 'recognition', start: m(2026, 7), end: m(2026, 8), short: 'Judge',
    title: 'Official Judge, Software, AI and Robotics', org: 'RoboRAVE Egypt · Alexandria', when: 'Jul 2026',
    text: 'From competitor to judge, the year after Beijing.', source: 'CV', status: 'cv-reported',
    photoPending: 'PHOTO PENDING · RoboRAVE Egypt judging, Jul 2026',
  },
];
