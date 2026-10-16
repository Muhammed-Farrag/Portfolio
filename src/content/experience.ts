/**
 * Work experience, internships and education (revision of 16 Oct 2026), kept apart so each reads
 * as its own kind. Facts follow docs/CONTENT_APPROVAL.md. Anything the owner has not confirmed
 * carries a `draft` note: development builds show it as a Draft mark, production renders the
 * entry as written. tests/unit/drafts.test.ts lists every draft so none is forgotten.
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
  draft?: string;
}

export interface Entry {
  id: string;
  org: string;
  title: string;
  when: string;
  text: string;
  link?: Link;
  draft?: string;
}

export const work: Role[] = [
  {
    id: 'cluster',
    org: 'Cluster',
    title: 'AI Operations Engineer',
    when: 'Jul–Aug 2026',
    kind: 'Company',
    text: 'AI operations across CRM fixes and a supply-chain data and scraping pipeline.',
    draft: 'Title wording and description: the CV and README describe different work.',
  },
  {
    id: 'tjm',
    org: 'TJM Labs',
    title: 'Software Developer',
    when: 'Oct–Dec 2025',
    kind: 'Company',
    text: 'Built and shipped features on the team’s software products.',
    draft: 'Title (CV: Software Developer, README: Software Engineer) and description.',
  },
  {
    id: 'freelance',
    org: 'Own clients',
    title: 'AI & Software Engineer',
    when: '2025–2026',
    kind: 'Freelance',
    text: 'Automation, AI integrations and web builds for clients, from first call to hand-over.',
    stats: [
      { value: '12+', label: 'clients' },
      { value: '~1', label: 'year' },
    ],
    draft: 'Dates and description. The 12+ clients and about one year are confirmed.',
  },
];

export const internships: Entry[] = [
  {
    id: 'stc',
    org: 'STC',
    title: 'Data Science Intern',
    when: 'Jul–Aug 2024',
    text: 'Data science internship; the project is on GitHub.',
    link: { href: 'https://github.com/Muhammed-Farrag/STC-TV', label: 'STC-TV project' },
    draft: 'Title (CV: Data Science Intern, README: AI & Data Analytics Intern) and description.',
  },
  {
    id: 'iti',
    org: 'ITI',
    title: 'Software Engineer Intern',
    when: 'Jul–Aug 2024',
    text: 'A summer software engineering internship.',
    draft: 'The project link and a line on what the project does.',
  },
];

export const education: Entry[] = [
  {
    id: 'gci',
    org: 'University of Tokyo · Japan',
    title: 'GCI World 2026',
    when: '2026',
    text: 'Participant in the GCI World 2026 programme.',
    draft: 'Programme dates and what it covered.',
  },
  {
    id: 'depi',
    org: 'Digital Egypt Pioneers Initiative (MCIT)',
    title: 'Generative AI Professional Trainee',
    when: 'Jun–Dec 2025',
    text: 'The Generative AI professional track. In April 2026 DEPI named me a Top Digital Pioneer.',
    link: { href: '#depi-pioneer-photo', label: 'See the honour' },
  },
  {
    id: 'bsc',
    org: 'Alamein International University',
    title: 'B.Sc. in Artificial Intelligence Science',
    when: '2022–2026',
    text: 'The degree that runs underneath everything else on this page.',
  },
];
