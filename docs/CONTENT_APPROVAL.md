# Content Approval Register

Status values: `verified` (a second source or the code supports it), `cv-reported` (use the CV wording), `pending` (owner input required; never rendered in a release build), `excluded`.

## Identity

| Claim | Status | Source | Notes |
|---|---|---|---|
| Public title: Applied AI Engineer | verified | CV, profile README | "The Architect" is an internal codename only |
| B.Sc. AI Science, Alamein International University, 2022–2026 | verified | CV, profile README | |
| Fabelian role | pending | — | Need the title, start date, and permission to mention it |
| Email `mohamed.frage19@gmail.com` | pending | CV, profile README | Needs approval before it is published on the site |
| Phone number | excluded | CV | Never published |
| LinkedIn `linkedin.com/in/muhammed-farrag-/` | pending | CV | Automated check is blocked (HTTP 999); verify by hand |
| GitHub `github.com/Muhammed-Farrag` | verified | HTTP 200 | |

## Experience

| Claim | Status | Source | Notes |
|---|---|---|---|
| Cluster, AI Operations Engineer, Jul–Aug 2026 | pending | CV vs profile README | The two describe different work: CRM fixes versus a supply-chain data and scraping architecture |
| TJM Labs, Oct–Dec 2025 | pending | CV "Software Developer" vs README "Software Engineer" | The CV title is the default |
| DEPI Generative AI Professional Trainee, Jun–Dec 2025 | cv-reported | CV | |
| STC, Jul–Aug 2024 | pending | CV "Data Science Intern" vs README "AI & Data Analytics Intern" | The CV title is the default |
| ITI Software Engineer Intern, Jul–Aug 2024 | verified | CV, README | |
| GCI World 2026, University of Tokyo | verified | Certificate (issued 31 Aug 2026) | Completed the April 2026 course of the Matsuo-Iwasawa Laboratory and passed its final assessment |
| IEEE AIU AI Committee Member | pending | profile README only | Optional |

## Beyond the Code

| Claim | Status | Source | Media |
|---|---|---|---|
| Montura, Best Creativity Trophy, RoboRAVE International, Beijing, Aug 2025 | verified | CV, profile README, owner photo | `roborave-beijing-2025-trophy.png` |
| DEPI Top Digital Pioneer Honoree, Apr 2026 | verified | CV, profile README, owner photo | `depi-top-digital-pioneer-ceremony.png` |
| RoboRAVE Egypt Official Judge, Software, AI and Robotics, Jul 2026, Alexandria | cv-reported | CV | **Placeholder:** no photo supplied |
| Al-Ahram coverage | pending | — | Not rendered until the article (link or scan, date, page) is supplied and verified |
| "Led Montura", "20+ countries", "Rank 1 (China)", "Excellent Creativity Trophy" | pending | profile README only | Not rendered unless verified |
| Montura collaborators and team | pending | — | Needed for accurate attribution |

## Projects

| Claim | Status | Source | Notes |
|---|---|---|---|
| Self-Healing architecture (9 steps) | verified | repository code | |
| Self-Healing governance thresholds shown in the simulation | pending | Traced in code (see SOURCE_AUDIT): only the 0.5 floor is enforced; the settings values are not used by the pipeline | The simulation is illustrative and shows no numeric threshold until confirmed |
| Self-Healing 100% accuracy | excluded | metrics.json (12 samples) | |
| HELIOS live demo `helios-rouge.vercel.app` | verified | HTTP 200, title match | Never link `helios.vercel.app` |
| HELIOS gesture rules (10 rounds, about 1 s fist reload, 1 s combo window) | verified | HELIOS README | Used by the gesture console simulation |
| NovaCare team project; your parts: ASL pipeline, Next.js pages | cv-reported | CV, contributor list | Exact contribution boundaries and teammate credit are pending |
| NovaCare 91.5% on 29 ASL classes | cv-reported | CV | Dataset and split to confirm |
| Advanced LangChain as a course lab | verified | README | The project name is pending (README vs CV) |
| Fourth featured case | pending | — | Recommendation: Advanced LangChain |
