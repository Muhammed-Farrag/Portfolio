// Selected work (Scene 03) and the Self-Healing pipeline (Scene 04). Every statement maps to
// docs/CONTENT_APPROVAL.md and docs/SOURCE_AUDIT.md: repository code and READMEs (verified) or the
// CV (cv-reported). Nothing here is a metric unless the register allows it.

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
}

export const selfHealing: CaseStudy = {
  id: 'self-healing',
  name: 'Self-Healing Automation Workflow',
  kind: 'Autonomous diagnosis and repair for data pipelines',
  stack: ['Python', 'Apache Airflow', 'scikit-learn', 'FAISS', 'Groq · Llama 3.3 70B', 'FastAPI', 'React', 'Docker Compose'],
  intro:
    'When an Airflow task fails, the system reads the log, works out what kind of failure it is, drafts a repair and decides whether that repair may be applied on its own or must wait for a person.',
  facts: [
    {
      label: 'Diagnosis',
      text: 'Logs are reduced to templates with Drain, then classified by regular-expression rules and a TF-IDF and Random Forest model.',
    },
    {
      label: 'Repair',
      text: 'Similar past repairs are retrieved from a FAISS playbook, and an LLM (Llama 3.3 70B on Groq, with Ollama as a fallback) drafts a structured repair plan.',
    },
    {
      label: 'Governance',
      text: 'A governor gates every plan. Plans the model flags, and any plan below a hard confidence floor, wait for human approval. Approved plans are applied by an AST patcher, checked in a sandbox and written to an audit log, with a dry-run rollback.',
    },
  ],
  links: [{ label: 'Repository', href: 'https://github.com/Muhammed-Farrag/SelfHealing-AutomationWorkflow' }],
};

export const helios: CaseStudy = {
  id: 'helios',
  name: 'HELIOS',
  kind: 'A hand-tracking AR shooter that runs in the browser',
  stack: ['MediaPipe HandLandmarker', 'Three.js', 'Vite'],
  intro: 'No downloads and no controllers: the webcam is the only input. Point your index finger to aim, pinch to fire, make a fist to reload.',
  facts: [
    { label: 'Tracking', text: 'MediaPipe HandLandmarker finds the hand in each webcam frame; the landmarks are turned into three gestures.' },
    { label: 'Rules', text: 'A 10-round magazine, a fist held for about a second to reload, and combos for hits within one second of each other.' },
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
  intro:
    'NovaCare is a team-built ecosystem around an assistive rover: sign-language recognition, a retrieval-augmented assistant, Bluetooth links and dashboards. My parts were the ASL recognition pipeline and the Next.js pages.',
  facts: [
    { label: 'My parts', text: 'The attention-based ASL recognition pipeline and the Next.js pages.' },
    { label: 'Result', text: '91.5% accuracy on 29 ASL classes, as reported in my CV.' },
  ],
  links: [{ label: 'Team repository', href: 'https://github.com/BasantAwad/NovaCare' }],
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

/** The nine steps of the Self-Healing pipeline, in order (repository modules). */
export const PIPELINE: { id: string; name: string; module: string; does: string }[] = [
  { id: 'inject', name: 'Inject', module: 'failure injector', does: 'An Airflow DAG task (http, db or file) is made to fail.' },
  { id: 'parse', name: 'Parse', module: 'Drain log parser', does: 'The task log is reduced to a log template.' },
  { id: 'classify', name: 'Classify', module: 'regex + TF-IDF / Random Forest', does: 'Rules and a model name the failure class.' },
  { id: 'retrieve', name: 'Retrieve', module: 'FAISS playbook', does: 'Similar past repairs are retrieved.' },
  { id: 'plan', name: 'Plan', module: 'LLM repair planner', does: 'Llama 3.3 70B on Groq drafts a repair plan with a confidence.' },
  { id: 'govern', name: 'Govern', module: 'governor', does: 'Flagged or low-confidence plans go to human review.' },
  { id: 'patch', name: 'Patch', module: 'AST patcher', does: 'The approved change is applied to .env or Python files.' },
  { id: 'validate', name: 'Validate', module: 'sandbox validator', does: 'The patched task runs in a sandbox.' },
  { id: 'audit', name: 'Audit', module: 'audit log', does: 'Every decision is recorded, with a dry-run rollback.' },
];
