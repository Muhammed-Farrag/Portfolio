import { Pending } from '../components/Pending';
import { Section } from '../components/layout/Section';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { sections } from '../content/site';
import { Contact } from '../sections/Contact';
import { Hero } from '../sections/Hero';
import './App.css';

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        {sections.map((s) => (
          <Section key={s.id} id={s.id} eyebrow={s.eyebrow} title={s.title} theme={s.theme} blendFrom={s.blendFrom}>
            <p>{s.summary}</p>
            <Pending>{s.pending}</Pending>
          </Section>
        ))}
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
