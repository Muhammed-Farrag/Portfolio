import { Pending } from '../components/Pending';
import { Section } from '../components/layout/Section';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { education, internships, work } from '../content/experience';
import { sections } from '../content/site';
import { Cinema } from '../features/cinema/Cinema';
import { useSiteMotion } from '../features/motion/reveal';
import { Contact } from '../sections/Contact';
import { Hero } from '../sections/Hero';
import { Events } from '../sections/events/Events';
import { Entries, Roles } from '../sections/experience/Experience';
import { Projects } from '../sections/projects/Projects';
import '../styles/backdrops.css';
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
        <Events s={byId('events')} />
        <Section {...experience} beat="Work experience" effect="clouds" backdrop="clouds" lead={<p className="section__lead">{experience.summary}</p>}>
          <Roles roles={work} />
        </Section>
        <Section {...growth} beat="Internships & education" effect="wipe" wide lead={<p className="section__lead">{growth.summary}</p>}>
          <div className="growth">
            <Entries id="internships" title="Internships" entries={internships} />
            <Entries id="education" title="Education" entries={education} />
          </div>
        </Section>
        <Projects s={byId('projects')} />
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
