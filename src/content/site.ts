// Site structure and the small amount of copy the shell needs. Every public statement here is
// approved in docs/CONTENT_APPROVAL.md (status verified or cv-reported). Anything still pending is
// marked `pending` and only ever rendered by <Pending>, which renders nothing in production.

export const profile = {
  name: 'Muhammed Farrag',
  title: 'Applied AI Engineer', // CV, GitHub profile: verified
  headline: 'Engineering intelligence into real-world systems.',
  focus: ['LLM systems', 'Intelligent automation', 'Computer vision'], // CV profile and skills
  github: 'https://github.com/Muhammed-Farrag', // HTTP 200: verified
  linkedin: 'https://www.linkedin.com/in/muhammed-farrag-/', // approved by the owner, 16 Oct 2026
  email: 'mohamed.frage19@gmail.com', // approved for publication by the owner, 16 Oct 2026
} as const;

export interface NavItem {
  id: string;
  label: string;
}

/** The navigation, in page order. Internships and Education are the two halves of one section. */
export const nav: NavItem[] = [
  { id: 'events', label: 'Events' },
  { id: 'experience', label: 'Experience' },
  { id: 'internships', label: 'Internships' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'contact', label: 'Contact' },
];

export type SectionTheme = 'deep' | 'mid' | 'elevated' | 'light';

export interface SectionDef {
  id: string;
  eyebrow: string;
  title: string;
  /** Short factual description shown in the shell. */
  summary: string;
  /** What the section will contain once its milestone is built (development only). */
  pending: string;
  /** Section theme (docs/DESIGN_SPEC.md §2.5). */
  theme: SectionTheme;
  /** Theme of the dark section above, when this one is dark too: the two blend with a gradient. */
  blendFrom?: SectionTheme;
}

/**
 * The sections between the hero and the contact scene, in page order (revision of 16 Oct 2026).
 * Each is one beat of the opening autoplay sequence (src/features/cinema).
 */
export const sections: SectionDef[] = [
  {
    id: 'events',
    eyebrow: 'Important events',
    title: 'Three moments',
    summary: 'A trophy in Beijing, an honour at home, and a seat on the judging panel.',
    pending: 'Event 3 details are draft (see its Draft mark).',
    theme: 'mid',
    blendFrom: 'deep',
  },
  {
    id: 'experience',
    eyebrow: 'Work experience',
    title: 'Where I have worked',
    summary: 'Company roles and a year of freelance work for my own clients.',
    pending: 'Details marked Draft are for the owner to confirm.',
    theme: 'elevated',
  },
  {
    id: 'growth',
    eyebrow: 'Internships & education',
    title: 'Where I learned',
    summary: 'Internships with the projects they produced, and the programmes behind them.',
    pending: 'Details marked Draft are for the owner to confirm.',
    theme: 'light',
  },
  {
    id: 'projects',
    eyebrow: 'Projects',
    title: 'Things I have built',
    summary: 'Four projects from my GitHub, each with something to try.',
    pending: 'M5: Lumina card and the rain background.',
    theme: 'deep',
  },
  {
    id: 'certificates',
    eyebrow: 'Certificates',
    title: 'Always learning',
    summary: 'Courses and certificates, from Python to deep learning.',
    pending: 'M6: the moving certificate gallery.',
    theme: 'light',
  },
];
