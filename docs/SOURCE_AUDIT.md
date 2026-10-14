# Source Audit

Snapshot taken 14 Oct 2026. Sources: the CV (`Muhammed-CV (1).pdf`, hyperlinks extracted), the public GitHub API and READMEs, repository code, live HTTP checks, and owner-supplied photographs.

## Particle Portrait reference

- Reference implementation: `D:\particle-portrait`. It is kept unchanged.
- `legacy/particle-portrait/` in this repo is a byte-identical copy (MD5: `index.html` 035c2fb3…, `portrait.js` dcf816b3…, `portrait.png` e1c9d63a…, `README.md` 638c8004…). It is never edited, and a unit test enforces the hashes. Defects are fixed in the maintained engine and the development Portrait Lab, not in the reference copy.
- `particle-portrait-preview.html` (5.18 MB) is not copied. It is now generated from source by `npm run build:preview`.
- Measured in Chromium with SwiftShader: 10,203 / 4,525 / 2,549 points at Ultra / Fine / Soft. The README records 10,207; the difference is image-decode color management.

## Repository evidence

| Repository | What the code or README supports | Caveats |
|---|---|---|
| `Muhammed-Farrag/SelfHealing-AutomationWorkflow` | Airflow DAGs (http, db, file), failure injector, Drain log parser, regex plus TF-IDF/Random Forest classifier, FAISS playbook retriever, LLM repair planner (Groq `llama-3.3-70b-versatile`, Ollama fallback), governor, AST patcher, sandbox validator, audit log, dry-run rollback, FastAPI, React dashboard, Docker Compose | `results/metrics.json` reports 1.0 accuracy on a **12-sample** test set: do not use. The frontend includes `mockData.ts`. Human-review thresholds conflict: the README says "confidence < 80%", `planner/repair_planner.py` requires approval when confidence < 0.5, and `settings.json` has `auto_patch_threshold 0.77` and `require_human_below 0.97`. Governor safety thresholds: false-repair rate > 0.20 pauses auto-patching, repair success rate < 0.60 pauses and escalates, more than 10 pending reviews alerts the operator. |
| `Muhammed-Farrag/HELIOS` | MediaPipe HandLandmarker, Three.js, gesture aim, pinch fire, fist reload, 10-round magazine, combo within 1 s, Vite | The README link `helios.vercel.app` points to an **unrelated site**. The verified deploy is `helios-rouge.vercel.app` (HTTP 200, title "HELIOS — Solar Instrument"). |
| `Muhammed-Farrag/Advanced-LangChain` | "Lab Work 4": support agent (FAISS, memory, tools) and research assistant (arXiv, Wikipedia, DuckDuckGo, relevance filtering, map-reduce, citations), Groq, Flask | The CV names it "Generative AI Workflow Studio". It is course lab work. |
| `BasantAwad/NovaCare` (linked from CV) | Team assistive-rover ecosystem: ASL, RAG, BLE, dashboards | Contributors by commits: BasantAwad 56, Ramez-Asaad 49, Muhammed-Farrag 14, NadiraElsirafy 4. The README stack (Flutter, Node, ESP32, Jetson) differs from the CV (Next.js). The 91.5% figure is not yet traced in the repo. |
| `Muhammed-Farrag/STC-TV` | EDA, ARIMA forecasting, recommendation notebooks | One notebook is named after a teammate (`…_Hozaifa`). Its link to the internship is unconfirmed. |
| `Muhammed-Farrag/Muhammed-Farrag` (profile README) | Timeline and awards | Several entries conflict with or go beyond the CV. See `CONTENT_APPROVAL.md`. |

## Owner-supplied media (14 Oct 2026)

| File | Shows | Supports |
|---|---|---|
| `content-source/recognition/01-montura-roborave-beijing-2025/originals/roborave-beijing-2025-trophy.png` (582×805) | Muhammed on the RoboRAVE 2025 arena floor, wearing the Egyptian flag and holding a trophy | Presence at RoboRAVE 2025 with a trophy. The trophy's name is not legible, so the award name rests on the CV. |
| `content-source/recognition/02-depi-top-digital-pioneer-2026/originals/depi-top-digital-pioneer-ceremony.png` (722×732) | Muhammed at a Digital Egypt Pioneers (أجيال مصر الرقمية) ceremony with a "رواد مصر الرقمية" sash and a certificate | Recognition at a DEPI ceremony. The certificate text is not legible, so the honoree title rests on the CV. |

The sponsor logos visible behind these photos are incidental and must not be used as endorsements.
