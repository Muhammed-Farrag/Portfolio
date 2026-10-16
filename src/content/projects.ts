// Projects. Every statement maps to docs/CONTENT_APPROVAL.md and docs/SOURCE_AUDIT.md: repository
// code and READMEs (verified) or the CV (cv-reported). Nothing here is a metric unless the register
// allows it. Copy is kept short: the opening sequence gives each word reading time.

export interface CaseFact {
  label: string;
  text: string;
}

export interface CaseLink {
  label: string;
  href: string;
  /** Extra, visible notice, e.g. that the destination uses the camera. */
  note?: string;
}

export interface CaseStudy {
  id: string;
  name: string;
  kind: string;
  stack: string[];
  intro: string;
  facts: CaseFact[];
  links: CaseLink[];
  /** Draft content the owner will confirm or edit; shown as a Draft mark in development only. */
  draft?: string;
}

export const helios: CaseStudy = {
  id: 'helios',
  name: 'HELIOS',
  kind: 'A hand-tracking AR shooter in the browser',
  stack: ['MediaPipe HandLandmarker', 'Three.js', 'Vite'],
  intro: 'No downloads, no controllers: the webcam is the only input. Point to aim, pinch to fire, make a fist to reload.',
  facts: [
    { label: 'Tracking', text: 'MediaPipe finds the hand in each webcam frame and turns it into three gestures.' },
    { label: 'Rules', text: 'A 10-round magazine, a held fist to reload, and combos for quick hits.' },
  ],
  links: [
    { label: 'Play HELIOS', href: 'https://helios-rouge.vercel.app', note: 'Asks for your webcam' },
    { label: 'Repository', href: 'https://github.com/Muhammed-Farrag/HELIOS' },
  ],
};

export const novaCare: CaseStudy = {
  id: 'novacare',
  name: 'NovaCare',
  kind: 'Team project · an assistive rover ecosystem',
  stack: ['Attention-based ASL recognition', 'Next.js'],
  intro: 'A team-built ecosystem around an assistive rover. I built the sign-language recognition pipeline and the Next.js pages.',
  facts: [{ label: 'Result', text: '91.5% accuracy on 29 ASL classes, as reported in my CV.' }],
  links: [{ label: 'Team repository', href: 'https://github.com/BasantAwad/NovaCare' }],
};

export const lumina: CaseStudy = {
  id: 'lumina',
  name: 'Lumina',
  kind: 'Gesture-controlled holographic spatial computing',
  stack: ['MediaPipe', 'Three.js', 'React', 'TypeScript'],
  intro: 'A holographic platform you steer with your hands, built with MediaPipe, Three.js and React. Its module so far is a solar system.',
  facts: [],
  links: [{ label: 'Repository', href: 'https://github.com/Muhammed-Farrag/Lumina' }],
  draft: 'What the solar system lets you do with your hands, and a live demo link if there is one.',
};

/** NovaCare modules. `mine` follows the CV; the team's modules are not attributed to named people yet. */
export const novaCareModules: { id: string; label: string; detail: string; mine: boolean; x: number; y: number }[] = [
  { id: 'asl', label: 'ASL recognition', detail: 'Attention-based recognition of 29 ASL classes (my part).', mine: true, x: 22, y: 26 },
  { id: 'web', label: 'Web pages', detail: 'The Next.js pages (my part).', mine: true, x: 78, y: 26 },
  { id: 'rag', label: 'RAG assistant', detail: 'Retrieval-augmented assistant (team).', mine: false, x: 88, y: 64 },
  { id: 'ble', label: 'BLE link', detail: 'Bluetooth Low Energy communication (team).', mine: false, x: 50, y: 88 },
  { id: 'dash', label: 'Dashboards', detail: 'Monitoring dashboards (team).', mine: false, x: 12, y: 64 },
];
