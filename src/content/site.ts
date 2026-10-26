// Site structure and the small amount of copy the shell needs. Every public statement here is
// approved in docs/CONTENT_APPROVAL.md (status verified or cv-reported).

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

/** The navigation, in page order. "Education" is the Education & internships timeline. */
export const nav: NavItem[] = [
  { id: 'events', label: 'Events' },
  { id: 'experience', label: 'Experience' },
  { id: 'growth', label: 'Education' },
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
  /** Section theme (docs/DESIGN_SPEC.md §2.5). */
  theme: SectionTheme;
  /** Theme of the dark section above, when this one is dark too: the two blend with a gradient. */
  blendFrom?: SectionTheme;
}

/**
 * The sections between the hero and the contact scene, in page order (revision of 16 Oct 2026).
 */
export const sections: SectionDef[] = [
  {
    id: 'events',
    eyebrow: 'Important events',
    title: 'Three moments',
    summary: 'A trophy in Beijing, an honour at home, and a seat on the judging panel.',
    theme: 'mid',
    blendFrom: 'deep',
  },
  {
    id: 'experience',
    eyebrow: 'Work experience',
    title: 'Where I have worked',
    summary: 'Company roles and a year of freelance work for my own clients.',
    theme: 'elevated',
  },
  {
    id: 'growth',
    eyebrow: 'Education & internships',
    title: 'Where I learned',
    summary: 'The programmes behind the work, and the internships that put them to use, with their certificates.',
    theme: 'light',
  },
  {
    id: 'projects',
    eyebrow: 'Projects',
    title: 'Things I have built',
    summary: 'Three projects from my GitHub, each with something to try.',
    theme: 'deep',
  },
  {
    id: 'certificates',
    eyebrow: 'Certificates',
    title: 'Always learning',
    summary: 'Courses and certificates, from Python to deep learning.',
    theme: 'light',
  },
];
