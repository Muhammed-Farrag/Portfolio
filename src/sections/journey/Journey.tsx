import { useState, type CSSProperties } from 'react';
import { Pending, SHOW_PENDING } from '../../components/Pending';
import { AXIS, LANES, journey, type JourneyItem } from '../../content/journey';
import type { SectionDef } from '../../content/site';
import './Journey.css';

const items = journey.filter((i) => SHOW_PENDING || i.status !== 'pending');
const span = AXIS.to - AXIS.from;
const years = Array.from({ length: span + 1 }, (_, k) => AXIS.from + k);

function Detail({ item }: { item: JourneyItem }) {
  return (
    <article className="journey__detail" key={item.id} aria-live="polite">
      <div className="journey__detail-text">
        <p className="mono journey__when">
          {item.when} · {item.org}
        </p>
        <h3 className="journey__title display">{item.title}</h3>
        <p className="journey__text">{item.text}</p>
        <p className="journey__source mono">Source: {item.source}</p>
        {item.link && (
          <a className="journey__link" href={item.link.href}>
            {item.link.label} <span aria-hidden="true">↑</span>
          </a>
        )}
      </div>
      {item.photo ? (
        <figure className="journey__photo">
          <img src={item.photo.src} alt={item.photo.alt} width={item.photo.width} height={item.photo.height} loading="lazy" decoding="async" />
          <figcaption className="mono">Photo: supplied by Muhammed</figcaption>
        </figure>
      ) : (
        item.photoPending && (
          <div className="journey__photo journey__photo--pending">
            <Pending block>{item.photoPending}</Pending>
          </div>
        )
      )}
    </article>
  );
}

export function Journey({ s }: { s: SectionDef }) {
  const [selected, setSelected] = useState('judge');
  const current = items.find((i) => i.id === selected) ?? items[0]!;

  return (
    <section id={s.id} className="section journey theme-light" aria-labelledby={`${s.id}-title`}>
      <div className="container">
        <header className="journey__header">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id={`${s.id}-title`} className="display section__title">
            {s.title}
          </h2>
          <p className="section__lead">{s.summary}</p>
        </header>

        <div className="journey__chart" data-reveal="" style={{ '--to': AXIS.to } as CSSProperties}>
          <div className="journey__years" aria-hidden="true">
            {years.map((y) => (
              <span key={y} style={{ '--y': y } as CSSProperties}>
                {y}
              </span>
            ))}
          </div>
          {LANES.map((lane) => (
            <div key={lane.id} className="journey__lane">
              <p className="journey__lane-label mono">{lane.label}</p>
              <ul className="journey__items" aria-label={lane.label}>
                {items
                  .filter((i) => i.lane === lane.id)
                  .map((i, k) => (
                    <li
                      key={i.id}
                      className="journey__item"
                      data-kind={i.end - i.start <= 1 / 12 + 1e-6 ? 'point' : 'range'}
                      data-row={i.row ?? 0}
                      data-pending={i.status === 'pending' ? '' : undefined}
                      data-before={i.start < 2024 || undefined}
                      style={{ '--s': i.start, '--e': i.end, '--order': k } as CSSProperties}
                    >
                      <button type="button" aria-pressed={i.id === current.id} onClick={() => setSelected(i.id)}>
                        <span className="journey__mark" aria-hidden="true" />
                        <span className="journey__short">{i.short}</span>
                        <span className="visually-hidden">
                          {' '}
                          · {i.title}, {i.when}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <Detail item={current} />
      </div>
    </section>
  );
}
