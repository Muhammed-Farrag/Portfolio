// Contact form delivery. Two ways, so the owner can choose (revision of 16 Oct 2026):
//  - 'mailto': opens the visitor's email app with the message written out. Needs no service.
//  - 'service': posts the message to a form service (e.g. Formspree) at VITE_FORM_ENDPOINT.
// The site uses VITE_CONTACT_MODE ('mailto' by default). Service mode without an endpoint falls
// back to mailto, so the form always works.

export type ContactMode = 'mailto' | 'service';

export interface Message {
  name: string;
  email: string;
  message: string;
}

export type Errors = Partial<Record<keyof Message, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Field errors in plain words; an empty object means the message can be sent. */
export function validate(m: Message): Errors {
  const errors: Errors = {};
  if (!m.name.trim()) errors.name = 'Please add your name.';
  if (!EMAIL.test(m.email.trim())) errors.email = 'Please add an email address I can reply to, like name@example.com.';
  if (m.message.trim().length < 10) errors.message = 'Please write a little more (at least 10 characters).';
  return errors;
}

const subjectOf = (m: Message) => `Portfolio message from ${m.name.trim()}`;
const bodyOf = (m: Message) => `${m.message.trim()}\n\n${m.name.trim()}\n${m.email.trim()}`;
const q = encodeURIComponent;

/** A mailto: link with the subject and body written out. */
export function mailtoHref(to: string, m: Message): string {
  return `mailto:${to}?subject=${q(subjectOf(m))}&body=${q(bodyOf(m))}`;
}

/**
 * Ways to send without a mail app: many computers have no default email program, so mailto:
 * does nothing there. Gmail and Outlook.com open the written-out message in the browser.
 */
export function webmailLinks(to: string, m: Message): { label: string; href: string }[] {
  return [
    { label: 'Gmail', href: `https://mail.google.com/mail/?view=cm&fs=1&to=${q(to)}&su=${q(subjectOf(m))}&body=${q(bodyOf(m))}` },
    { label: 'Outlook.com', href: `https://outlook.live.com/mail/0/deeplink/compose?to=${q(to)}&subject=${q(subjectOf(m))}&body=${q(bodyOf(m))}` },
  ];
}

/** The whole message as plain text, for pasting into any email. */
export const plainText = (to: string, m: Message) => `To: ${to}\nSubject: ${subjectOf(m)}\n\n${bodyOf(m)}`;

/** The delivery the site uses: the configured mode, or mailto when the service has no endpoint. */
export function resolveMode(mode: string | undefined, endpoint: string | undefined): ContactMode {
  return mode === 'service' && endpoint ? 'service' : 'mailto';
}

/** Posts the message to the form service. Resolves when it is accepted; throws otherwise. */
export async function postToService(endpoint: string, m: Message, fetchImpl: typeof fetch = fetch): Promise<void> {
  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: m.name.trim(), email: m.email.trim(), message: m.message.trim(), _subject: `Portfolio message from ${m.name.trim()}` }),
  });
  if (!res.ok) throw new Error(`The form service answered ${res.status}`);
}

export const CONTACT_ENV = {
  mode: import.meta.env.VITE_CONTACT_MODE as string | undefined,
  endpoint: import.meta.env.VITE_FORM_ENDPOINT as string | undefined,
};
