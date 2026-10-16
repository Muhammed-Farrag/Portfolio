import type { CSSProperties } from 'react';
import photoUrl from '../assets/portrait/photo.webp';
import { Pending } from '../components/Pending';
import { profile } from '../content/site';
import './Contact.css';

const LINKS = [
  { label: 'Code', text: 'github.com/Muhammed-Farrag', href: profile.github, note: undefined },
  { label: 'Live project', text: 'Play HELIOS', href: 'https://helios-rouge.vercel.app', note: 'asks for your webcam' },
] as const;

export function Contact() {
  return (
    <section id="contact" className="contact theme-elevated" aria-labelledby="contact-title" data-beat="Contact" data-beat-min="5000" data-beat-effect="rays">
      <div className="container contact__grid">
        {/* The Hero's photograph again, graded into the palette and cut to his silhouette. */}
        <div className="contact__portrait" style={{ '--photo': `url(${photoUrl})` } as CSSProperties} aria-hidden="true">
          <img src={photoUrl} alt="" width={738} height={738} loading="lazy" decoding="async" />
        </div>
        <div className="contact__body">
          <p className="eyebrow" data-reveal="">
            Contact
          </p>
          <h2 id="contact-title" className="display contact__title" data-reveal="">
            Let’s build the next <em>useful</em> thing.
          </h2>
          <p className="contact__lead" data-reveal="">
            LLM systems, intelligent automation and computer vision, engineered to run in the real world.
          </p>
          <ul className="contact__links" data-reveal="">
            {LINKS.map((l) => (
              <li key={l.href}>
                <span className="mono contact__label">{l.label}</span>
                <a href={l.href} rel="noopener noreferrer" target="_blank">
                  {l.text} <span aria-hidden="true">↗</span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                {l.note && <span className="contact__note">{l.note}</span>}
              </li>
            ))}
          </ul>
          <Pending>LinkedIn (manual verification) and email (publication approval) are pending in CONTENT_APPROVAL.md.</Pending>
        </div>
      </div>
    </section>
  );
}
