import { useRef } from 'react';
import { profile } from '../content/site';
import './Hero.css';
import { HeroPortrait } from './HeroPortrait';
import { HeroStars } from './HeroStars';

/**
 * The opening scene: the night sky, his portrait, name and title. Painting order: the star field,
 * then the transparent particle canvas (one WebGL context), then the text and the portrait slot.
 */
export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <section id="top" className="hero theme-deep" aria-labelledby="hero-name" data-beat="Arrival" data-beat-min="6500">
      <HeroStars />
      <div className="hero__layer" aria-hidden="true">
        <canvas ref={canvasRef} className="hero__canvas" />
      </div>
      <div className="container hero__layout">
        <div className="hero__text">
          <p className="eyebrow">{profile.title}</p>
          <h1 id="hero-name" className="display hero__name">
            <span className="hero__name-outline">Muhammed</span> <span>Farrag</span>
          </h1>
          <p className="hero__headline">{profile.headline}</p>
        </div>
        <HeroPortrait canvasRef={canvasRef} />
      </div>
    </section>
  );
}
