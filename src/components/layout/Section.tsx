import type { ReactNode } from 'react';
import type { SectionTheme } from '../../content/site';
import './Section.css';

interface Props {
  id: string;
  eyebrow: string;
  title: string;
  theme: SectionTheme;
  blendFrom?: SectionTheme | undefined;
  /** Shown under the title, in the header column. */
  lead?: ReactNode;
  children?: ReactNode;
}

/** Shared section frame: anchor target, heading structure and the 12/8/4 column grid. */
export function Section({ id, eyebrow, title, theme, blendFrom, lead, children }: Props) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={`section theme-${theme}`} data-blend={blendFrom} aria-labelledby={headingId}>
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
