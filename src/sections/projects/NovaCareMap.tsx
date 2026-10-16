import { useState } from 'react';
import { novaCareModules } from '../../content/projects';

/**
 * Who built what: the NovaCare ecosystem as a hub with five modules. My modules are filled; the
 * team's are outlined. Focusing or hovering a module shows what it does; the toggle switches
 * between my parts and the whole team.
 */
export function NovaCareMap() {
  const [mineOnly, setMineOnly] = useState(true);
  const [active, setActive] = useState(novaCareModules[0]!.id);
  const current = novaCareModules.find((m) => m.id === active)!;

  return (
    <div className="nova" data-mine-only={mineOnly || undefined}>
      <div className="nova__map">
        <svg className="nova__wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {novaCareModules.map((m) => (
            <line key={m.id} x1="50" y1="52" x2={m.x} y2={m.y} data-mine={m.mine || undefined} data-active={m.id === active || undefined} />
          ))}
        </svg>
        <div className="nova__hub" aria-hidden="true">
          <span className="mono">NovaCare</span>
          <span className="nova__rover">rover</span>
        </div>
        <ul className="nova__modules" aria-label="NovaCare modules">
          {novaCareModules.map((m) => (
            <li key={m.id} style={{ left: `${m.x}%`, top: `${m.y}%` }}>
              <button
                type="button"
                className="nova__module"
                data-mine={m.mine || undefined}
                aria-pressed={m.id === active}
                onClick={() => setActive(m.id)}
                onPointerEnter={() => setActive(m.id)}
                onFocus={() => setActive(m.id)}
              >
                {m.label}
                <span className="visually-hidden">{m.mine ? ' (my part)' : ' (team)'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="nova__footer">
        <p className="nova__detail" aria-live="polite">
          <span className="mono">{current.mine ? 'My part' : 'Team'}</span> {current.detail}
        </p>
        <button type="button" className="button nova__toggle" aria-pressed={mineOnly} onClick={() => setMineOnly((v) => !v)}>
          Highlight my parts
        </button>
      </div>
    </div>
  );
}
