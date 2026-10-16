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

export const selfHealing: CaseStudy = {
  id: 'self-healing',
  name: 'Self-Healing Automation Workflow',
  kind: 'Autonomous diagnosis and repair for data pipelines',
  stack: ['Python', 'Apache Airflow', 'scikit-learn', 'FAISS', 'Llama 3.3 70B', 'FastAPI', 'React'],
  intro: 'When an Airflow task fails, it reads the log, names the failure, drafts a repair and decides whether a person must approve it.',
  facts: [
    { label: 'Diagnosis', text: 'Drain log templates, regex rules and a TF-IDF and Random Forest classifier.' },
    { label: 'Repair', text: 'Similar fixes from a FAISS playbook; Llama 3.3 70B on Groq drafts the plan.' },
    { label: 'Governance', text: 'Flagged or low-confidence plans wait for a person. Approved ones are patched, sandboxed and audited.' },
  ],
  links: [{ label: 'Repository', href: 'https://github.com/Muhammed-Farrag/SelfHealing-AutomationWorkflow' }],
};

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

/** The five failure classes the repository's classifier reports. */
export const FAILURE_CLASSES = ['http_error', 'missing_column', 'missing_db', 'missing_file', 'timeout'] as const;
export type FailureClass = (typeof FAILURE_CLASSES)[number];

/** Illustrative log lines for each class, written for the simulation (not taken from a real run). */
export const FAILURE_LOGS: Record<FailureClass, { task: string; line: string; playbook: string }> = {
  http_error: {
    task: 'fetch_rates',
    line: 'requests.exceptions.HTTPError: 503 Server Error: Service Unavailable',
    playbook: 'retry with backoff; check the endpoint',
  },
  missing_column: {
    task: 'transform_orders',
    line: "KeyError: 'customer_id' not in DataFrame columns",
    playbook: 'map the renamed column; update the schema',
  },
  missing_db: {
    task: 'load_orders',
    line: 'sqlite3.OperationalError: unable to open database file',
    playbook: 'restore the connection setting in .env',
  },
  missing_file: {
    task: 'extract_daily',
    line: "FileNotFoundError: [Errno 2] No such file or directory: 'data/daily.csv'",
    playbook: 'point the task at the configured input path',
  },
  timeout: {
    task: 'aggregate_week',
    line: 'AirflowTaskTimeout: Timeout, PID: 4127',
    playbook: 'raise execution_timeout; split the batch',
  },
};
