import type { ReactNode } from 'react';
import type { SectionTheme } from '../../content/site';
import { Starfield } from '../Starfield';
import './Section.css';

interface Props {
  id: string;
  eyebrow: string;
  title: string;
  theme: SectionTheme;
  blendFrom?: SectionTheme | undefined;
  /** Shown under the title, in the header column. */
  lead?: ReactNode;
  /** The body spans the full width under the header, for content laid out in its own columns. */
  wide?: boolean;
  children?: ReactNode;
}

/** Shared section frame: anchor target, heading structure, the 12/8/4 column grid and the star field behind. */
export function Section({ id, eyebrow, title, theme, blendFrom, lead, wide, children }: Props) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={`section has-stars theme-${theme}${wide ? ' section--wide' : ''}`} data-blend={blendFrom} aria-labelledby={headingId}>
      <Starfield tone={theme === 'light' ? 'light' : 'dark'} />
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
