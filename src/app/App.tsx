import { Pending } from '../components/Pending';
import { Section } from '../components/layout/Section';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { sections, type SectionDef } from '../content/site';
import { Contact } from '../sections/Contact';
import { ApproachFigure } from '../sections/ApproachFigure';
import { Hero } from '../sections/Hero';
import { HeroApproachStory } from '../sections/HeroApproachStory';
import { Work } from '../sections/work/Work';
import { UnderTheHood } from '../sections/UnderTheHood';
import { Recognition } from '../sections/recognition/Recognition';
import { Journey } from '../sections/journey/Journey';
import { useSiteMotion } from '../features/motion/reveal';
import './App.css';

const byId = (id: string) => sections.find((s) => s.id === id)!;

/** The summary sits under the title so the particles travel down an empty column to the figure. */
function ApproachSection({ s }: { s: SectionDef }) {
  return (
    <Section id={s.id} eyebrow={s.eyebrow} title={s.title} theme={s.theme} blendFrom={s.blendFrom} lead={<p className="section__lead">{s.summary}</p>}>
      <ApproachFigure />
      <Pending>{s.pending}</Pending>
    </Section>
  );
}

export function App() {
  useSiteMotion();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <HeroApproachStory>
          <Hero />
          <ApproachSection s={byId('approach')} />
        </HeroApproachStory>
        <Work s={byId('work')} />
        <UnderTheHood s={byId('under-the-hood')} />
        <Recognition s={byId('recognition')} />
        <Journey s={byId('journey')} />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
