import type { CSSProperties, ReactNode } from 'react';
import { Pending } from '../../components/Pending';
import type { SectionDef } from '../../content/site';
import { helios, lumina, novaCare, selfHealing, type CaseStudy } from '../../content/projects';
import { HeliosConsole } from './HeliosConsole';
import { LuminaOrbits } from './LuminaOrbits';
import { NovaCareMap } from './NovaCareMap';
import { SelfHealingTerminal } from './SelfHealingTerminal';
import './Projects.css';

function External({ href, children, note }: { href: string; children: ReactNode; note?: string | undefined }) {
  return (
    <a className="case__link" href={href} rel="noopener noreferrer" target="_blank">
      {children} <span aria-hidden="true">↗</span>
      {note && <span className="case__link-note"> · {note}</span>}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

/** One case study: index, name and facts beside its own interactive visual. */
function Case({ study, index, visual, flip = false }: { study: CaseStudy; index: number; visual: ReactNode; flip?: boolean }) {
  return (
    <article id={`case-${study.id}`} className="case" data-flip={flip || undefined} aria-labelledby={`case-${study.id}-title`}>
      <div className="case__text" data-reveal="">
        <div className="case__index" aria-hidden="true">
          {String(index).padStart(2, '0')}
        </div>
        <p className="eyebrow">{study.kind}</p>
        <h3 id={`case-${study.id}-title`} className="case__name display">
          {study.name}
        </h3>
        <p className="case__intro">{study.intro}</p>
        {study.facts.length > 0 && (
          <dl className="case__facts">
            {study.facts.map((f) => (
              <div key={f.label}>
                <dt className="mono">{f.label}</dt>
                <dd>{f.text}</dd>
              </div>
            ))}
          </dl>
        )}
        <ul className="case__stack" aria-label="Built with" data-cinema-skip="">
          {study.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="case__links">
          {study.links.map((l) => (
            <External key={l.href} href={l.href} note={l.note}>
              {l.label}
            </External>
          ))}
        </p>
        {study.draft && <Pending label="Draft">{study.draft}</Pending>}
      </div>
      <div className="case__visual" data-reveal="" data-cinema-skip="" style={{ '--reveal-order': 1 } as CSSProperties}>
        {visual}
      </div>
    </article>
  );
}

/** Projects: four case studies, each with its own interactive visual. */
export function Projects({ s }: { s: SectionDef }) {
  return (
    <section id={s.id} className={`section work theme-${s.theme}`} data-beat="Projects" data-beat-effect="ripple" data-backdrop="water" aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <header className="work__header">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id={`${s.id}-title`} className="display section__title work__title">
            {s.title}
          </h2>
          <p className="section__lead work__lead">{s.summary}</p>
        </header>
        <div className="work__cases">
          <Case study={selfHealing} index={1} visual={<SelfHealingTerminal />} />
          <Case study={helios} index={2} visual={<HeliosConsole />} flip />
          <Case study={novaCare} index={3} visual={<NovaCareMap />} />
          <Case study={lumina} index={4} visual={<LuminaOrbits />} flip />
        </div>
      </div>
    </section>
  );
}
