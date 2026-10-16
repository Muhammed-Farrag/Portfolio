import { Pending } from '../components/Pending';
import { Section } from '../components/layout/Section';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { sections } from '../content/site';
import { Cinema } from '../features/cinema/Cinema';
import { useSiteMotion } from '../features/motion/reveal';
import { Contact } from '../sections/Contact';
import { Hero } from '../sections/Hero';
import { Recognition } from '../sections/recognition/Recognition';
import { Work } from '../sections/work/Work';
import './App.css';

const byId = (id: string) => sections.find((s) => s.id === id)!;

/** Page order (revision of 16 Oct 2026): Hero → Events → Experience → Internships & Education → Projects → Certificates → Contact. */
export function App() {
  useSiteMotion();
  const experience = byId('experience');
  const growth = byId('growth');
  const certificates = byId('certificates');
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Recognition s={byId('events')} />
        <Section {...experience} beat="Work experience" effect="clouds" lead={<p className="section__lead">{experience.summary}</p>}>
          <Pending>{experience.pending}</Pending>
        </Section>
        <Section {...growth} beat="Internships & education" effect="wipe" lead={<p className="section__lead">{growth.summary}</p>}>
          <div className="growth">
            <div id="internships">
              <h3 className="growth__title">Internships</h3>
            </div>
            <div id="education">
              <h3 className="growth__title">Education</h3>
            </div>
          </div>
          <Pending>{growth.pending}</Pending>
        </Section>
        <Work s={byId('projects')} />
        <Section {...certificates} beat="Certificates" effect="cards" lead={<p className="section__lead">{certificates.summary}</p>}>
          <Pending>{certificates.pending}</Pending>
        </Section>
        <Contact />
      </main>
      <SiteFooter />
      <Cinema />
    </>
  );
}
