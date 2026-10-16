import { Pending } from '../../components/Pending';
import type { Entry, Role } from '../../content/experience';
import './Experience.css';

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
          {r.draft && <Pending label="Draft">{r.draft}</Pending>}
        </li>
      ))}
    </ol>
  );
}

/** Internships or education: a dated list on a rail. */
export function Entries({ id, title, entries }: { id: string; title: string; entries: Entry[] }) {
  return (
    <div id={id} className="entries">
      <h3 className="entries__title">{title}</h3>
      <ol className="entries__list">
        {entries.map((e) => {
          const external = e.link && !e.link.href.startsWith('#');
          return (
            <li key={e.id} className="entry" data-reveal="">
              <p className="entry__when mono">{e.when}</p>
              <h4 className="entry__title">{e.title}</h4>
              <p className="entry__org">{e.org}</p>
              <p className="entry__text">{e.text}</p>
              {e.link && (
                <a className="entry__link" href={e.link.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {e.link.label} <span aria-hidden="true">{external ? '↗' : '↑'}</span>
                  {external && <span className="visually-hidden"> (opens in a new tab)</span>}
                </a>
              )}
              {e.draft && <Pending label="Draft">{e.draft}</Pending>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
