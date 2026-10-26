import heroPortrait from '../assets/hero/avenue-portrait-900.webp';
import hero1200 from '../assets/hero/avenue-1200.webp';
import hero2400 from '../assets/hero/avenue-2400.webp';
import { GitHubIcon, LinkedInIcon } from '../components/SocialIcons';
import { profile } from '../content/site';
import './Hero.css';

/**
 * The opening scene: a still photograph of him on a tree-lined avenue, centred, with his name split
 * around him: the first name, the role and his profiles on the left, the last name and the headline
 * on the right. On phones a crop centred on him sits above the name and the headline.
 */
export function Hero() {
  return (
    <section id="top" className="hero theme-deep" aria-labelledby="hero-name">
      <picture className="hero__photo">
        <source media="(max-width: 899.98px)" srcSet={heroPortrait} width={900} height={1000} />
        <img
          src={hero2400}
          srcSet={`${hero1200} 1200w, ${hero2400} 2400w`}
          sizes="100vw"
          width={2400}
          height={1107}
          alt="Muhammed Farrag smiling on a tree-lined avenue, in a black T-shirt."
          decoding="async"
        />
      </picture>
      <div className="hero__layout">
        <h1 id="hero-name" className="display hero__name">
          <span className="hero__first">Muhammed</span> <span className="hero__last">Farrag</span>
        </h1>
        <p className="eyebrow hero__role">{profile.title}</p>
        <p className="hero__headline">{profile.headline}</p>
        <ul className="hero__social" aria-label="Profiles">
          <li>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)">
              <GitHubIcon />
            </a>
          </li>
          <li>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)">
              <LinkedInIcon />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
