import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import photoUrl from '../assets/portrait/photo.webp';
import { SHOW_PENDING } from '../components/Pending';
import { profile } from '../content/site';
import { CONTACT_ENV, mailtoHref, plainText, postToService, resolveMode, validate, webmailLinks, type ContactMode, type Errors, type Message } from '../features/contact/send';
import './Contact.css';

const LINKS = [
  { label: 'Email', text: profile.email, href: `mailto:${profile.email}`, external: false },
  { label: 'LinkedIn', text: 'in/muhammed-farrag-', href: profile.linkedin, external: true },
  { label: 'GitHub', text: 'github.com/Muhammed-Farrag', href: profile.github, external: true },
] as const;

type Status = { kind: 'idle' } | { kind: 'choose'; copied?: boolean } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error' };

const EMPTY: Message = { name: '', email: '', message: '' };

/** The message form. Sends through the visitor's email app or a form service (src/features/contact). */
function ContactForm() {
  const id = useId();
  const [values, setValues] = useState<Message>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  // In development the owner can try both deliveries; the site itself uses VITE_CONTACT_MODE.
  const [devMode, setDevMode] = useState<ContactMode>(resolveMode(CONTACT_ENV.mode, CONTACT_ENV.endpoint));
  const mode = SHOW_PENDING ? (devMode === 'service' && !CONTACT_ENV.endpoint ? 'mailto' : devMode) : resolveMode(CONTACT_ENV.mode, CONTACT_ENV.endpoint);

  const field = (name: keyof Message) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
    },
  });
  const error = (name: keyof Message) =>
    errors[name] && (
      <p id={`${id}-${name}-error`} className="form__error">
        {errors[name]}
      </p>
    );

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = (Object.keys(found) as (keyof Message)[])[0];
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    // Email mode: many computers have no mail app, so offer every way to send, not just mailto.
    if (mode === 'mailto') {
      setStatus({ kind: 'choose' });
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      await postToService(CONTACT_ENV.endpoint!, values);
      setValues(EMPTY);
      setStatus({ kind: 'sent' });
    } catch {
      setStatus({ kind: 'error' });
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="form__title">
        Send a message
      </h3>
      {SHOW_PENDING && (
        <fieldset className="form__dev" data-pending="">
          <legend className="mono">Delivery · development only</legend>
          {(['mailto', 'service'] as const).map((m) => (
            <label key={m}>
              <input type="radio" name="delivery" value={m} checked={devMode === m} onChange={() => setDevMode(m)} />
              {m === 'mailto' ? 'Email app (mailto)' : 'Form service'}
            </label>
          ))}
          {devMode === 'service' && !CONTACT_ENV.endpoint && <span>No VITE_FORM_ENDPOINT set, so this falls back to the email app.</span>}
        </fieldset>
      )}
      <div className="form__row">
        <div className="form__field">
          <label htmlFor={`${id}-name`}>Name</label>
          <input {...field('name')} type="text" autoComplete="name" required />
          {error('name')}
        </div>
        <div className="form__field">
          <label htmlFor={`${id}-email`}>Email</label>
          <input {...field('email')} type="email" autoComplete="email" required />
          {error('email')}
        </div>
      </div>
      <div className="form__field">
        <label htmlFor={`${id}-message`}>Message</label>
        <textarea {...field('message')} rows={5} required />
        {error('message')}
      </div>
      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p className="form__status" role="status">
          {status.kind === 'choose' && 'Your message is written out. Choose how to send it:'}
          {status.kind === 'sent' && 'Thank you, your message is on its way. I will reply by email.'}
          {status.kind === 'error' && `The message could not be sent. Please try again, or write to ${profile.email}.`}
        </p>
      </div>
      {status.kind === 'choose' && (
        <div className="form__choices">
          <a className="button" href={mailtoHref(profile.email, values)}>
            Email app
          </a>
          {webmailLinks(profile.email, values).map((l) => (
            <a key={l.label} className="button" href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label} <span aria-hidden="true">↗</span>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          ))}
          <button
            type="button"
            className="button"
            onClick={() =>
              void navigator.clipboard?.writeText(plainText(profile.email, values)).then(
                () => setStatus({ kind: 'choose', copied: true }),
                () => setStatus({ kind: 'choose' }),
              )
            }
          >
            {status.copied ? 'Copied' : 'Copy the message'}
          </button>
        </div>
      )}
    </form>
  );
}

export function Contact() {
  return (
    <section id="contact" className="contact theme-elevated" aria-labelledby="contact-title" data-beat="Contact" data-beat-min="5000" data-beat-effect="rays">
      <div className="container contact__grid">
        {/* The Hero's photograph again, in a Void and Sandstone duotone, cut to his silhouette. */}
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
              <li key={l.label}>
                <span className="mono contact__label">{l.label}</span>
                <a href={l.href} {...(l.external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
                  {l.text} <span aria-hidden="true">{l.external ? '↗' : '→'}</span>
                  {l.external && <span className="visually-hidden"> (opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </ul>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
