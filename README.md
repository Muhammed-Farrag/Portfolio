# Muhammed Farrag - Portfolio

An immersive, premium portfolio website built with a **Cyberpunk / Neo-Terminal** aesthetic.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **3D Graphics:** React Three Fiber + Three.js
- **Fonts:** JetBrains Mono (headers), Inter (body)

## 🎨 Design System

### Colors
- **Void Black:** `#050505` - Primary background
- **Neon Green:** `#00ff41` - Terminal/success states
- **Electric Purple:** `#bf00ff` - AI accents
- **Cyber Blue:** `#00d4ff` - Secondary accent

### Features
- Terminal boot sequence animation
- 3D particle background with floating geometry
- Glitch text effects
- Glassmorphism components
- Scroll-triggered animations
- Interactive skill chips with glow effects
- Vertical timeline for experience

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

The development server runs at `http://localhost:3000`

**Tip:** The boot sequence is cached in sessionStorage. Refresh the page to see it again, or clear sessionStorage.

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles & design tokens
│   ├── layout.tsx       # Root layout with fonts & metadata
│   └── page.tsx         # Main page component
├── components/
│   ├── TerminalBootSequence.tsx   # Boot animation
│   ├── HeroSection.tsx            # Hero with 3D background
│   ├── HeroBackground.tsx         # React Three Fiber scene
│   ├── ExperienceSection.tsx      # Timeline component
│   ├── ProjectsSection.tsx        # Project cards
│   ├── SkillsSection.tsx          # Skills grid
│   ├── ContactSection.tsx         # Contact form
│   ├── Navigation.tsx             # Fixed nav bar
│   ├── Footer.tsx                 # Footer component
│   └── index.ts                   # Barrel exports
└── data/
    └── portfolio.ts      # All portfolio data
```

## 🎯 Customization

### Profile Data
Edit `src/data/portfolio.ts` to update:
- Personal information
- Work experience
- Projects
- Skills
- Social links

### Styling
- Tailwind config: `tailwind.config.ts`
- CSS variables: `src/app/globals.css`

## 📱 Responsive Design

The portfolio is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## ⚡ Performance

- Dynamic imports for code splitting
- Optimized 3D rendering with frustum culling
- Lazy loading of sections
- Efficient Framer Motion animations

## 📄 License

MIT License - Feel free to use this as a template for your own portfolio!

---

Built with ❤️ and ☕ by Muhammed Farrag
