import aharamUrl from '../assets/recognition/al-ahram-2026-09-07.webp';
import depiUrl from '../assets/recognition/depi-2026.webp';
import beijingUrl from '../assets/recognition/roborave-beijing-2025.webp';

/** The three Important Events (revision of 16 Oct 2026), in page order. Facts as in content-source/recognition/manifest.json. */
export interface EventDef {
  id: string;
  scene: 'victory' | 'ceremony' | 'judging';
  role: string;
  title: string;
  event: string;
  photo: { src: string; alt: string; width: number; height: number; caption: string };
  /** Draft content the owner will confirm or edit; shown as a Draft mark in development only. */
  draft?: string;
}

export const events: EventDef[] = [
  {
    id: 'roborave-beijing',
    scene: 'victory',
    role: 'Montura · Competitor',
    title: 'Best Creativity Trophy',
    event: 'RoboRAVE International Entrepreneurial Challenge · Beijing · August 2025',
    photo: {
      src: beijingUrl,
      alt: 'Muhammed Farrag on the RoboRAVE 2025 arena floor, wearing the Egyptian flag and holding a trophy.',
      width: 582,
      height: 805,
      caption: 'Beijing · August 2025',
    },
  },
  {
    id: 'depi-pioneer',
    scene: 'ceremony',
    role: 'DEPI · Honoree',
    title: 'Top Digital Pioneer',
    event: 'Digital Egypt Pioneers Initiative (MCIT) · Egypt · April 2026',
    photo: {
      src: depiUrl,
      alt: 'Muhammed Farrag at a Digital Egypt Pioneers ceremony, wearing a recognition sash and holding a certificate.',
      width: 722,
      height: 732,
      caption: 'DEPI ceremony · April 2026',
    },
  },
  {
    id: 'roborave-egypt-judge',
    scene: 'judging',
    role: 'RoboRAVE Egypt · Judge',
    title: 'Official Judge',
    event: 'Robotics, Software and AI · Alexandria · July 2026',
    photo: {
      src: aharamUrl,
      alt: 'Al-Ahram clipping, 7 September 2026: the headline reads that three teams from Alexandria’s Faculty of Computers compete in the cybersecurity finals in Japan, above a photo of the team on stage.',
      width: 391,
      height: 405,
      caption: 'Al-Ahram · 7 September 2026 · issue 51044',
    },
    draft: 'Confirm the Al-Ahram clipping (Japan, cybersecurity) belongs with this event, and the judging details.',
  },
];
