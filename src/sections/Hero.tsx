import { profile } from '../content/site';
import './Hero.css';
import { HeroPortrait } from './HeroPortrait';

export function Hero() {
  return (
    <section id="top" className="hero theme-deep" aria-labelledby="hero-name">
      <div className="container hero__layout">
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
        <HeroPortrait />
      </div>
    </section>
  );
}
