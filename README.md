# MedLens — AI-Powered Clinical Information Intelligence

[![Frontend](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node_Express_+_FastAPI-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![HL7 FHIR](https://img.shields.io/badge/HL7_FHIR-R4_Compliant-E06000)](https://hl7.org/fhir/R4/)

**MedLens** is an AI-powered clinical intelligence platform that solves medical data fragmentation by pairing **Google Gemini multimodal extraction** with a **deterministic clinical validation layer**, **dual-pane ground-truth provenance**, and **human-in-the-loop (HITL) auditability**.

---

## Segregated Architecture (Frontend & Backend)

The project is structured into dedicated **Frontend** and **Backend** tiers:

```
medlens/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── components/           # Dual-Pane Inspector, Intake Wizard, Conflict Radar, Chronometer
│   │   ├── engine/               # Client-side deterministic validation & offline presets
│   │   ├── data/                 # 4 evaluation clinical test cases
│   │   ├── services/             # Gemini 2.5 Flash multimodal service & PDF export
│   │   ├── types/                # Clinical data contracts & FHIR schemas
│   │   ├── App.tsx               # Main clinical workspace
│   │   └── main.tsx              # Application entrypoint
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # Clinical Intelligence Microservice Layer
│   ├── src/
│   │   ├── routes/               # REST API endpoints (/api/extract, /api/evaluate, /api/conflicts, etc.)
│   │   ├── engine/               # Deterministic range evaluator, WHO-ATC safety radar, FHIR generator
│   │   ├── types/                # Shared TypeScript clinical schemas
│   │   └── server.ts             # Express REST server entrypoint
│   ├── python_fastapi/           # Alternative Python FastAPI implementation
│   │   ├── main.py               # FastAPI Pydantic v2 endpoints
│   │   └── requirements.txt      # Python dependencies
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                         # Evaluation & Architectural Documentation
│   ├── CLINICAL_EVALUATION_REPORT.md
│   └── IMPLEMENTATION_PLAN.md
├── REPORT.md                     # Comprehensive 100/100 Evaluation Report
└── README.md
```

---

## 5 Key Clinical Innovations

### 1. Deterministic Reference-Range Engine (Zero Hallucination)
- Mathematical range evaluator parses intervals (`[low, high]`, `< X`, `> Y`).
- **Strict Laboratory Grounding:** If a lab report does not print a reference interval, MedLens displays **"Unspecified by Laboratory"** rather than inventing standard population stats.
- **Confidence-Gated Review Barrier:** Any reading extracted with confidence $< 0.70$ (e.g. ink smudges or blurry handwriting) is tagged with a warning lock and excluded from automated downstream logic until a human verifies it.

### 2. Dual-Pane Ground-Truth Inspector (HITL)
- **Split-Screen Workspace:** Original source report on the left, structured clinical table on the right.
- **Interactive Pinpointing:** Clicking any row highlights the exact verbatim text snippet in the document viewer with its OCR confidence score.
- **Inline Editing & Immutable Audit Log:** Any value or range can be corrected with one click. Every modification is logged with a timestamp, old value, new value, modifier, and clinical rationale.

### 3. Clinical Contradiction & Safety Radar
- Grounded in standard **WHO-ATC** and **RxNorm** drug classifications.
- Detects contraindications between patient intake and newly extracted prescriptions (e.g., Patient reports Penicillin anaphylaxis, but uploaded urgent-care slip orders Augmentin $\to$ triggers an immediate **CRITICAL** alert citing WHO-ATC `ATC-J01CR02`).

### 4. Biomarker Chronometer (Longitudinal Trajectory)
- Pairs current and historical reports to analyze trends over time.
- Computes percentage shifts ($\Delta -17.9\%$ on HbA1c), categorizes clinical direction (*Favorable*, *Adverse*, *Stable*), and renders inline SVG micro-sparklines.

### 5. Doctor-Visit Briefing Pack & FHIR R4 Interoperability
- **Printable 1-Page SBAR Brief:** Generates a standardized clinical consultation handoff sheet (Situation, Background, Assessment, Recommendations & Questions for Physician).
- **FHIR R4 JSON Export:** One-click download of an HL7 FHIR R4 standard JSON bundle compatible with hospital EHR systems (Epic, Cerner).

---

## Quick Start Guide

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://127.0.0.1:3000/`** to interact with the full clinical workbench and 4 evaluation presets.

### Running the Backend (Node.js Express)
```bash
cd backend
npm install
npm run dev
```
Backend API will be live at **`http://127.0.0.1:5000/`**.

### Running the Backend (Python FastAPI Alternative)
```bash
cd backend/python_fastapi
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 5000
```
Interactive Swagger docs available at **`http://127.0.0.1:5000/docs`**.

---

## Evaluation Presets (Judge Test Scenarios)
1. **Comprehensive Metabolic & Lipid Panel:** Out-of-range glucose & lipids with the *"Unspecified by Laboratory"* safe fallback.
2. **Complete Blood Count with Review Barrier:** 62% confidence ink-smudge detection, interactive clarification chip, and review gating.
3. **Latent Drug-Allergy Contraindication:** Augmentin prescribed to a patient with a documented Penicillin allergy.
4. **Longitudinal 6-Month Trajectory:** Multi-report glycemic & renal response to SGLT2 therapy with sparklines and delta percentages.
