import type { ReactNode } from 'react';
import './Section.css';

interface Props {
  id: string;
  eyebrow: string;
  title: string;
  tone?: 'ground' | 'surface' | 'alt';
  children?: ReactNode;
}

/** Shared section frame: anchor target, heading structure and the 12/8/4 column grid. */
export function Section({ id, eyebrow, title, tone = 'ground', children }: Props) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={`section section--${tone}`} aria-labelledby={headingId}>
      <div className="container grid">
        <header className="section__header">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={headingId} className="display section__title">
            {title}
          </h2>
        </header>
        <div className="section__body">{children}</div>
      </div>
    </section>
  );
}
