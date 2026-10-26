import { useState, type CSSProperties } from 'react';
import { certificates, monthYear, type Certificate } from '../../content/certificates';
import type { Entry, LearningKind, Role } from '../../content/experience';
import { CertificateDialog } from '../certificates/CertificateDialog';
import './Experience.css';
import './Timeline.css';

/** Work experience: one card per role, the kind of work on a badge. */
export function Roles({ roles }: { roles: Role[] }) {
  return (
    <ol className="roles" data-reveal="">
      {roles.map((r) => (
        <li key={r.id} className="role" data-kind={r.kind}>
          <div className="role__meta mono">
            <span className="role__kind">{r.kind}</span>
            <span>{r.when}</span>
          </div>
          <h3 className="role__org display">{r.org}</h3>
          <p className="role__title">{r.title}</p>
          <p className="role__text">{r.text}</p>
          {r.stats && (
            <dl className="role__stats">
              {r.stats.map((s) => (
                <div key={s.label}>
                  <dt className="mono">{s.label}</dt>
                  <dd className="display">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ol>
  );
}

const byId = (id: string) => {
  const c = certificates.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown certificate ${id}; see src/content/certificates.data.json`);
  return c;
};

/**
 * Education and internships on one timeline, oldest first. Desktop: a horizontal line with a node
 * per entry and its card alternating above and below. Smaller screens: the line runs down the left.
 * An entry's certificates open in the lightbox.
 */
export function Timeline({ entries }: { entries: (Entry & { kind: LearningKind })[] }) {
  const [open, setOpen] = useState<{ list: Certificate[]; shown: Certificate } | null>(null);
  return (
    <>
      <ol className="timeline" style={{ '--count': entries.length } as CSSProperties}>
        {entries.map((e, i) => {
          const external = e.link && !e.link.href.startsWith('#');
          const certs = (e.certificates ?? []).map(byId);
          return (
            <li key={e.id} className="timeline__item" data-side={i % 2 ? 'down' : 'up'} data-kind={e.kind} style={{ '--i': i } as CSSProperties}>
              <span className="timeline__line" aria-hidden="true" />
              <span className="timeline__node" aria-hidden="true" />
              <span className="timeline__year mono" aria-hidden="true">
                {e.start.slice(0, 4)}
              </span>
              <article className="timeline__card" data-reveal="">
                <p className="timeline__meta mono">
                  <span className="timeline__tag">{e.kind}</span>
                  <span>{e.when}</span>
                </p>
                <h3 className="timeline__title">{e.title}</h3>
                <p className="timeline__org">{e.org}</p>
                <p className="timeline__text">{e.text}</p>
                {e.link && (
                  <a className="timeline__link" href={e.link.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {e.link.label} <span aria-hidden="true">{external ? '↗' : '↑'}</span>
                    {external && <span className="visually-hidden"> (opens in a new tab)</span>}
                  </a>
                )}
                {certs.length > 0 && (
                  <ul className="timeline__certs" aria-label={`Certificates for ${e.title}`}>
                    {certs.map((c) => (
                      <li key={c.id}>
                        <button type="button" className="timeline__cert" onClick={() => setOpen({ list: certs, shown: c })} aria-label={`${c.title}, ${c.issuer}, ${monthYear(c.date)}. View the certificate.`}>
                          <img src={c.card} alt="" width={560} height={Math.round((560 * c.height) / c.width)} loading="lazy" decoding="async" />
                          <span className="timeline__cert-label mono">Certificate</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
      <CertificateDialog list={open?.list ?? []} open={open?.shown ?? null} onOpen={(c) => setOpen(c && open ? { list: open.list, shown: c } : null)} />
    </>
  );
}
