import { profile } from '../content/site';
import './Hero.css';
import { HeroPortrait } from './HeroPortrait';
import { HeroStars } from './HeroStars';

/** The opening scene: the night sky, his portrait, name and title. Nothing else competes. */
export function Hero() {
  return (
    <section id="top" className="hero theme-deep" aria-labelledby="hero-name">
      <HeroStars />
      <div className="container hero__layout">
        <div className="hero__text">
          <p className="eyebrow">{profile.title}</p>
          <h1 id="hero-name" className="display hero__name">
            <span>Muhammed</span> <span>Farrag</span>
          </h1>
          <p className="hero__headline">{profile.headline}</p>
        </div>
        <HeroPortrait />
      </div>
    </section>
  );
}
