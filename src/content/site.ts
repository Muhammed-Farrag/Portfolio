// Site structure and the small amount of copy the shell needs. Every public statement here is
// approved in docs/CONTENT_APPROVAL.md (status verified or cv-reported). Anything still pending is
// marked `pending` and only ever rendered by <Pending>, which renders nothing in production.

export const profile = {
  name: 'Muhammed Farrag',
  title: 'Applied AI Engineer', // CV, GitHub profile: verified
  headline: 'Engineering intelligence into real-world systems.',
  focus: ['LLM systems', 'Intelligent automation', 'Computer vision'], // CV profile and skills
  github: 'https://github.com/Muhammed-Farrag', // HTTP 200: verified
} as const;

export interface NavItem {
  id: string;
  label: string;
}

/** Sections that appear in the navigation, in page order. */
export const nav: NavItem[] = [
  { id: 'approach', label: 'Approach' },
  { id: 'work', label: 'Work' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'journey', label: 'Journey' },
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

/** Scenes 02-06 of the storyboard. The hero (01) and contact (07) have their own components. */
export const sections: SectionDef[] = [
  {
    id: 'approach',
    eyebrow: 'How I work',
    title: 'From model to running system',
    summary: 'Intelligence, orchestration, product and operations: the four layers every project on this page moves through.',
    pending: 'Scene 02: links from each layer to the projects that use it.',
    theme: 'mid',
    blendFrom: 'deep',
  },
  {
    id: 'work',
    eyebrow: 'Selected work',
    title: 'Projects, with the engineering shown',
    summary: 'Self-Healing Automation Workflow, NovaCare and HELIOS, each with the challenge, my contribution, the approach and the outcome.',
    pending: 'Scene 03: four case studies (fourth case pending owner decision), HELIOS gesture console.',
    theme: 'light',
  },
  {
    id: 'under-the-hood',
    eyebrow: 'Under the hood',
    title: 'One real system, step by step',
    summary: 'How the Self-Healing workflow turns an injected pipeline failure into a governed, auditable repair plan.',
    pending: 'Scene 04: nine-step pipeline diagram and the illustrative inject-a-failure simulation.',
    theme: 'elevated',
  },
  {
    id: 'recognition',
    eyebrow: 'Beyond the code',
    title: 'Competitor, honoree, judge',
    summary: 'RoboRAVE International in Beijing (August 2025), the Digital Egypt Pioneers Initiative (April 2026) and RoboRAVE Egypt (July 2026).',
    pending: 'Scene 05: three connected stories with owner-supplied photographs; judge photo and Al-Ahram material pending.',
    theme: 'deep',
    blendFrom: 'elevated',
  },
  {
    id: 'journey',
    eyebrow: 'Experience',
    title: 'Experience and evolution',
    summary: 'From internships at ITI and STC in 2024 to AI operations work in 2026, alongside a B.Sc. in Artificial Intelligence Science.',
    pending: 'Scene 06: true-scale timeline of concurrent roles; Cluster, TJM and STC wording and the current role pending.',
    theme: 'light',
  },
];
