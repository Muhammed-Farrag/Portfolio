import { profile } from '../../content/site';
import { Starfield } from '../Starfield';
import './SiteFooter.css';

const LINKS = [
  { label: 'GitHub', href: profile.github },
  { label: 'LinkedIn', href: profile.linkedin },
  { label: 'Email', href: `mailto:${profile.email}` },
];

export function SiteFooter() {
  return (
    <footer className="site-footer has-stars theme-deep">
      <Starfield />
      <div className="container site-footer__inner">
        <div className="site-footer__name">
          <span className="site-footer__mark mono" aria-hidden="true">
            MF
          </span>
          <p>
            <strong>{profile.name}</strong>
            <span>{profile.title}</span>
          </p>
        </div>
        <ul className="site-footer__links" aria-label="Elsewhere">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {l.label}
                {l.href.startsWith('http') && <span className="visually-hidden"> (opens in a new tab)</span>}
              </a>
            </li>
          ))}
        </ul>
        <a className="site-footer__top" href="#top">
          Back to top <span aria-hidden="true">↑</span>
        </a>
        <p className="site-footer__small mono">© 2026 {profile.name}</p>
      </div>
    </footer>
  );
}
