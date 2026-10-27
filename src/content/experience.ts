/**
 * Work experience, education and internships (revision of 26 Oct 2026), kept apart so each reads
 * as its own kind. Facts follow docs/CONTENT_APPROVAL.md.
 */

export interface Link {
  href: string;
  label: string;
}

export interface Role {
  id: string;
  org: string;
  title: string;
  when: string;
  kind: 'Company' | 'Freelance';
  text: string;
  /** Big figures shown on the card, e.g. 12+ clients. */
  stats?: { value: string; label: string }[];
  link?: Link;
}

export interface Entry {
  id: string;
  org: string;
  title: string;
  when: string;
  /** When it started (YYYY-MM): the order on the timeline. */
  start: string;
  text: string;
  link?: Link;
  /** Certificates that belong to this entry: ids from certificates.data.json (scripts/certificates.py). */
  certificates?: string[];
}

export const work: Role[] = [
  {
    id: 'cluster',
    org: 'Cluster',
    title: 'AI Operations Engineer',
    when: 'Jul–Aug 2026',
    kind: 'Company',
    text: 'AI operations across CRM fixes and a supply-chain data and scraping pipeline.',
  },
  {
    id: 'tjm',
    org: 'TJM Labs',
    title: 'Software Developer',
    when: 'Oct–Dec 2025',
    kind: 'Company',
    text: 'Built and shipped features on the team’s software products.',
  },
  {
    id: 'freelance',
    org: 'Fabelian',
    title: 'AI & Software Engineer',
    when: '2025–2026',
    kind: 'Freelance',
    text: 'My own studio for AI, software and cybersecurity: automation, AI integrations and web builds for clients, from first call to hand-over.',
    stats: [
      { value: '12+', label: 'clients' },
      { value: '~1', label: 'year' },
    ],
    link: { href: 'https://www.instagram.com/fabelian.solutions/', label: 'Fabelian on Instagram' },
  },
];

export const internships: Entry[] = [
  {
    id: 'stc',
    org: 'STC',
    title: 'Data Science Intern',
    when: 'Jul–Aug 2024',
    start: '2024-07',
    text: 'Data science internship; the project is on GitHub.',
    link: { href: 'https://github.com/Muhammed-Farrag/STC-TV', label: 'STC-TV project' },
    certificates: ['stc'],
  },
  {
    id: 'iti',
    org: 'ITI',
    title: 'Software Engineer Intern',
    when: 'Jul–Aug 2024',
    start: '2024-07',
    text: 'A summer software engineering internship, with its Mahara-Tech courses in C++ and Java database programming.',
    certificates: ['mastering-object-oriented-programming-oop-using-c', 'jdbc'],
  },
];

export const education: Entry[] = [
  {
    id: 'gci',
    org: 'University of Tokyo · Japan',
    title: 'GCI World 2026',
    when: '2026 · April cohort',
    start: '2026-04',
    text: 'The data science course of the Matsuo-Iwasawa Laboratory, Graduate School of Engineering. Completed with its final assessment passed.',
    certificates: ['gci-world-2026'],
  },
  {
    id: 'depi',
    org: 'Digital Egypt Pioneers Initiative (MCIT)',
    title: 'Generative AI Professional Trainee',
    when: 'Jun–Dec 2025',
    start: '2025-06',
    text: 'The Generative AI professional track. In April 2026 DEPI named me a Top Digital Pioneer.',
    link: { href: '#events', label: 'See the honour' },
  },
  {
    id: 'bsc',
    org: 'Alamein International University',
    title: 'B.Sc. in Artificial Intelligence Science',
    when: '2022–2026',
    start: '2022-09',
    text: 'The degree that runs underneath everything else on this page.',
  },
];

export type LearningKind = 'Education' | 'Internship';

/** Education and internships on one timeline, oldest first (same month: the listed order). */
export const learning: (Entry & { kind: LearningKind })[] = [
  ...education.map((e) => ({ ...e, kind: 'Education' as const })),
  ...internships.map((e) => ({ ...e, kind: 'Internship' as const })),
].sort((a, b) => a.start.localeCompare(b.start));
