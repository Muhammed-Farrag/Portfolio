import { useEffect } from 'react';
import { PageFrame } from '../components/layout/PageFrame';
import { Section } from '../components/layout/Section';
import { SiteHeader } from '../components/layout/SiteHeader';
import { learning, work } from '../content/experience';
import { sections } from '../content/site';
import { useSiteMotion } from '../features/motion/reveal';
import { Contact } from '../sections/Contact';
import { Hero } from '../sections/Hero';
import { Certificates } from '../sections/certificates/Certificates';
import { Events } from '../sections/events/Events';
import { Roles, Timeline } from '../sections/experience/Experience';
import { Projects } from '../sections/projects/Projects';
import './App.css';

const byId = (id: string) => sections.find((s) => s.id === id)!;

/** Page order (v3, 26 Oct 2026): Hero → Events → Experience → Education & Internships → Projects → Certificates → Contact. */
export function App() {
  useSiteMotion();
  // A link to a section (/#contact): the browser looked for it before the page had rendered, so go
  // there now, and again once the fonts have settled the layout.
  useEffect(() => {
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const go = () => target.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    go();
    void document.fonts?.ready.then(go);
  }, []);
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
        <Section {...experience} wide lead={<p className="section__lead">{experience.summary}</p>}>
          <Roles roles={work} />
        </Section>
        <Section {...growth} wide lead={<p className="section__lead">{growth.summary}</p>}>
          <Timeline entries={learning} />
        </Section>
        <Projects s={byId('projects')} />
        <Certificates s={certificates} />
        <Contact />
      </main>
      <PageFrame />
    </>
  );
}
