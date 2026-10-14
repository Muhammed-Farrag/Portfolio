import { Pending, SHOW_PENDING } from '../components/Pending';
import { profile } from '../content/site';
import './Contact.css';

export function Contact() {
  return (
    <section id="contact" className="contact theme-elevated" aria-labelledby="contact-title">
      <div className="container grid">
        {/* The photo slot exists only while its placeholder is shown; production has no empty column. */}
        {SHOW_PENDING && (
          <div className="contact__photo" aria-hidden="true">
            <Pending block>Second photograph treatment (Scene 07).</Pending>
          </div>
        )}
        <div className="contact__body">
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title" className="display contact__title">
            Let’s build the next <em>useful</em> thing.
          </h2>
          <div className="contact__actions">
            <a className="button button--primary" href={profile.github} rel="noopener noreferrer" target="_blank">
              GitHub <span aria-hidden="true">↗</span>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>
          <Pending>LinkedIn (manual verification) and email (publication approval) are pending in CONTENT_APPROVAL.md.</Pending>
        </div>
      </div>
    </section>
  );
}
