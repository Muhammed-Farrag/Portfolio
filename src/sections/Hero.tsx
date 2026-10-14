import { Pending } from '../components/Pending';
import { profile } from '../content/site';
import './Hero.css';

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-name">
      <div className="container grid hero__grid">
        <div className="hero__text">
          <p className="eyebrow">{profile.title}</p>
          <h1 id="hero-name" className="display hero__name">
            <span>Muhammed</span> <span>Farrag</span>
          </h1>
          <p className="hero__headline">{profile.headline}</p>
          <ul className="hero__focus" aria-label="Focus areas">
            {profile.focus.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="hero__actions">
            <a className="button button--primary" href="#work">
              Explore the work <span aria-hidden="true">↓</span>
            </a>
            <a className="button" href={profile.github} rel="noopener noreferrer" target="_blank">
              GitHub <span aria-hidden="true">↗</span>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <a className="button" href="#contact">
              Contact
            </a>
          </div>
        </div>
        {/* Reserved square for the Particle Portrait (next milestone), so the layout does not shift. */}
        <div className="hero__portrait" aria-hidden="true">
          <Pending block>Particle Portrait: integrated in the Hero milestone (botanical tone on Deep Ivy).</Pending>
        </div>
      </div>
    </section>
  );
}
