import type { ReactNode } from 'react';
import type { SectionTheme } from '../../content/site';
import type { Effect } from '../../features/cinema/Cinema';
import './Section.css';

interface Props {
  id: string;
  eyebrow: string;
  title: string;
  theme: SectionTheme;
  blendFrom?: SectionTheme | undefined;
  /** Shown under the title, in the header column. */
  lead?: ReactNode;
  /** Name of the scene in the opening sequence, and the transition that brings it on (src/features/cinema). */
  beat?: string;
  effect?: Effect;
  /** A still background shape behind the section (src/styles/backdrops.css). */
  backdrop?: 'clouds' | 'water' | 'rays';
  children?: ReactNode;
}

/** Shared section frame: anchor target, heading structure and the 12/8/4 column grid. */
export function Section({ id, eyebrow, title, theme, blendFrom, lead, beat, effect, backdrop, children }: Props) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={`section theme-${theme}`} data-blend={blendFrom} data-beat={beat} data-beat-effect={effect} data-backdrop={backdrop} aria-labelledby={headingId}>
      <div className="container grid">
        <header className="section__header">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={headingId} className="display section__title">
            {title}
          </h2>
          {lead}
        </header>
        <div className="section__body">{children}</div>
      </div>
    </section>
  );
}
