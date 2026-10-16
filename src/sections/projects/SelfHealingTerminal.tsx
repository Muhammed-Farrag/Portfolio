import { useState, type CSSProperties } from 'react';
import { FAILURE_CLASSES, FAILURE_LOGS, type FailureClass } from '../../content/projects';

/** Classes the illustration holds for review; the others are shown as approved. Illustrative only. */
const HELD: FailureClass[] = ['missing_db', 'timeout'];

/**
 * An illustrative terminal: pick a failure class and the log of one repair episode types in.
 * Plain text in the DOM; the typing is a CSS reveal and is skipped when motion is paused.
 */
export function SelfHealingTerminal() {
  const [kind, setKind] = useState<FailureClass>('missing_file');
  const log = FAILURE_LOGS[kind];
  const held = HELD.includes(kind);
  const lines: [string, string, string?][] = [
    ['airflow', `task ${log.task} failed`, 'bad'],
    ['', log.line, 'raw'],
    ['drain', 'log reduced to a known template'],
    ['classify', kind, 'hit'],
    ['playbook', log.playbook],
    ['planner', 'repair plan drafted, with a confidence'],
    ['governor', held ? 'held for human review' : 'approved for patch', held ? 'warn' : 'ok'],
    ['audit', 'episode recorded'],
  ];

  return (
    <div className="terminal theme-deep">
      <div className="terminal__bar">
        <span className="terminal__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mono">self-healing · episode</span>
      </div>
      <div className="terminal__classes" role="group" aria-label="Failure class">
        {FAILURE_CLASSES.map((c) => (
          <button key={c} type="button" className="terminal__class" aria-pressed={c === kind} onClick={() => setKind(c)}>
            {c}
          </button>
        ))}
      </div>
      <ol className="terminal__log" key={kind} aria-live="polite">
        {lines.map(([who, text, tone], k) => (
          <li key={k} className="terminal__line" data-tone={tone} style={{ '--line': k } as CSSProperties}>
            <span className="terminal__who">{who}</span>
            <span className="terminal__text">{text}</span>
          </li>
        ))}
      </ol>
      <p className="terminal__note mono">Illustrative log, generated in your browser</p>
    </div>
  );
}
