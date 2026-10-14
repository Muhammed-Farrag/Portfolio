import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SectionDef } from '../content/site';
import { FAILURE_CLASSES, FAILURE_LOGS, PIPELINE, type FailureClass } from '../content/work';
import { isMotionPaused } from '../features/motion/motion';
import './UnderTheHood.css';

type Confidence = 'confident' | 'uncertain';
type StepState = 'idle' | 'done' | 'active' | 'skipped';

const STEP_MS = 700;
const GOVERN = PIPELINE.findIndex((s) => s.id === 'govern');
const SKIPPED_WHEN_HELD = new Set(['patch', 'validate']);

/** What the episode log says at each step. Illustrative, built from the repository's modules. */
function logLine(step: string, kind: FailureClass, held: boolean): string {
  const log = FAILURE_LOGS[kind];
  switch (step) {
    case 'inject': return `task ${log.task} failed: ${log.line}`;
    case 'parse': return 'Drain reduced the log to a template';
    case 'classify': return `classified as ${kind}`;
    case 'retrieve': return `playbook match: ${log.playbook}`;
    case 'plan': return held ? 'plan drafted; the model is unsure' : 'plan drafted; the model is confident';
    case 'govern': return held ? 'held: sent to the human review queue' : 'approved for an automatic patch';
    case 'patch': return 'AST patch applied';
    case 'validate': return 'sandbox run passed';
    case 'audit': return held ? 'recorded; waiting for a reviewer' : 'recorded, with a dry-run rollback ready';
    default: return '';
  }
}

export function UnderTheHood({ s }: { s: SectionDef }) {
  const [kind, setKind] = useState<FailureClass>('missing_column');
  const [confidence, setConfidence] = useState<Confidence>('confident');
  /** Index of the step the episode has reached; -1 before the first run. */
  const [at, setAt] = useState(-1);
  const [running, setRunning] = useState(false);
  const [episode, setEpisode] = useState<{ kind: FailureClass; held: boolean } | null>(null);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const held = episode?.held ?? false;
  const path = PIPELINE.map((p) => p.id).filter((id) => !(held && SKIPPED_WHEN_HELD.has(id)));

  const inject = () => {
    clearTimeout(timer.current);
    const next = { kind, held: confidence === 'uncertain' };
    setEpisode(next);
    const steps = PIPELINE.map((p) => p.id).filter((id) => !(next.held && SKIPPED_WHEN_HELD.has(id)));
    if (isMotionPaused()) {
      setAt(PIPELINE.length - 1);
      setRunning(false);
      return;
    }
    setRunning(true);
    let k = 0;
    const advance = () => {
      setAt(PIPELINE.findIndex((p) => p.id === steps[k]));
      k++;
      if (k < steps.length) timer.current = window.setTimeout(advance, STEP_MS);
      else setRunning(false);
    };
    advance();
  };

  const stateOf = (index: number, id: string): StepState => {
    if (!episode || at < 0) return 'idle';
    if (held && SKIPPED_WHEN_HELD.has(id)) return at > GOVERN ? 'skipped' : 'idle';
    if (index === at && running) return 'active';
    return index <= at ? 'done' : 'idle';
  };
  const reached = episode ? path.filter((id) => PIPELINE.findIndex((p) => p.id === id) <= at) : [];
  const reviewActive = held && at >= GOVERN;

  return (
    <section id={s.id} className="section hood theme-elevated" aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <header className="hood__header">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id={`${s.id}-title`} className="display section__title">
            {s.title}
          </h2>
          <p className="section__lead">{s.summary}</p>
        </header>

        <div className="hood__console" data-reveal="">
          <div className="hood__controls">
            <fieldset className="hood__field">
              <legend className="mono">1 · Failure class</legend>
              <div className="hood__options">
                {FAILURE_CLASSES.map((c) => (
                  <button key={c} type="button" className="hood__option" aria-pressed={c === kind} onClick={() => setKind(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="hood__field">
              <legend className="mono">2 · The model’s plan</legend>
              <div className="hood__options">
                <button type="button" className="hood__option" aria-pressed={confidence === 'confident'} onClick={() => setConfidence('confident')}>
                  Confident
                </button>
                <button type="button" className="hood__option" aria-pressed={confidence === 'uncertain'} onClick={() => setConfidence('uncertain')}>
                  Unsure or flagged
                </button>
              </div>
            </fieldset>
            <button type="button" className="button button--primary hood__inject" onClick={inject}>
              {running ? 'Restart episode' : 'Inject the failure'} <span aria-hidden="true">→</span>
            </button>
          </div>

          <ol className="hood__pipeline" aria-label="The nine pipeline steps" style={{ '--at': Math.max(at, 0) } as CSSProperties} data-run={episode ? '' : undefined}>
            {PIPELINE.map((p, i) => (
              <li key={p.id} className="hood__step" data-state={stateOf(i, p.id)}>
                <span className="hood__num mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="hood__name">{p.name}</span>
                <span className="hood__module mono">{p.module}</span>
                <span className="hood__does">{p.does}</span>
              </li>
            ))}
          </ol>
          <div className="hood__review" data-active={reviewActive || undefined}>
            <span className="mono">Human review queue</span>
            <span>{reviewActive ? 'This plan waits here for a person. Patch and validate run only after approval.' : 'Flagged and low-confidence plans wait here for a person.'}</span>
          </div>

          <div className="hood__log">
            <p className="mono hood__log-title">Episode log</p>
            <ol aria-live="polite">
              {episode ? (
                reached.map((id) => (
                  <li key={id}>
                    <span className="mono">{id}</span> {logLine(id, episode.kind, episode.held)}
                  </li>
                ))
              ) : (
                <li className="hood__log-empty">Pick a failure class and inject it to watch one episode.</li>
              )}
            </ol>
          </div>
          <p className="hood__note mono">Simulation in your browser: no backend and no model calls. No threshold values are shown until they are confirmed.</p>
        </div>
      </div>
    </section>
  );
}
