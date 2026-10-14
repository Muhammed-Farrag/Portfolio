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
| `Muhammed-Farrag/SelfHealing-AutomationWorkflow` | Airflow DAGs (http, db, file), failure injector, Drain log parser, regex plus TF-IDF/Random Forest classifier, FAISS playbook retriever, LLM repair planner (Groq `llama-3.3-70b-versatile`, Ollama fallback), governor, AST patcher, sandbox validator, audit log, dry-run rollback, FastAPI, React dashboard, Docker Compose | `results/metrics.json` reports 1.0 accuracy on a **12-sample** test set: do not use. The frontend includes `mockData.ts`. Human-review gate: see "Self-Healing review gate" below. |
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

## Self-Healing review gate (traced 14 Oct 2026, repository HEAD `57d5f46c1670`)

Question: which threshold decides whether a repair plan is applied automatically or sent to human review?

| Location | Value | Does it control behaviour? |
|---|---|---|
| `planner/repair_planner.py` `_validate_plan()` | confidence < **0.5** must have `requires_human_approval: true`, otherwise the plan is rejected | **Yes.** It is a hard floor enforced in code. Invalid or unparseable LLM output becomes a fallback plan with confidence 0.0 and `requires_human_approval: true`. |
| LLM output (`SYSTEM_PROMPT` schema) | `requires_human_approval` chosen by the model | **Yes**, above 0.5. The model's own flag decides, and no numeric rule is applied. |
| `patcher/patch_applier.py`, `sandbox/validator.py` | — | They act on the flag: plans with `requires_human_approval: true` are refused (the validator skips them unless `--force`). `governance/governor.py approve()` clears the flag after a human approves. |
| `settings.json` (`auto_patch_threshold` 0.77, `require_human_below` 0.97, `confidence_threshold` 0.61) and `main.py` defaults (0.8 / 0.5 / 0.5) | — | **No** behaviour found. They are only read and written by `GET/PUT /api/settings/thresholds` and shown on the dashboard Settings page. None of the pipeline modules inspected (planner, governor, patcher, validator, classifier, playbook, evaluator, episode generator) reads them. |
| README "confidence < 80%" | 80% | **No** matching code found. |
| `governance/governor.py SAFETY_THRESHOLDS` | false-repair rate > 0.20, repair success rate < 0.60, more than 10 pending reviews | System-level pause and alert checks, not the per-plan gate. |

Conclusion: the per-plan gate is "the model flags the plan for review, and anything below 0.5 confidence is always flagged". The site's simulation therefore shows the workflow (confidence → governed branch → auto-patch or review queue) **without any number presented as fact**, until Muhammed confirms the intended values.
