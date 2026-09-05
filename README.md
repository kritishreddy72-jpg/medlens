# MedLens — AI-Powered Clinical Information Intelligence

[![Frontend](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node_Express_API-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![HL7 FHIR](https://img.shields.io/badge/HL7_FHIR-R4_Compliant-E06000)](https://hl7.org/fhir/R4/)
[![Tests](https://img.shields.io/badge/Tests-18_Passed_Vitest-brightgreen)](https://vitest.dev/)

**MedLens** is an open-source clinical information intelligence platform that pairs **Google Gemini multimodal vision extraction** with a **deterministic clinical validation layer**, **dual-pane ground-truth provenance**, and **human-in-the-loop (HITL) auditability**.

---

## Evaluation Criteria Alignment

| Evaluation Dimension | How MedLens Implements It | Verified Implementation |
| :--- | :--- | :--- |
| **Feasibility & Reliability** | Deterministic mathematical range comparison layer decoupled from LLM inference; pure functions evaluate intervals, less-than, greater-than, qualitative results, and critical bounds without hallucination. | [`packages/clinical-engine/src/rangeEvaluator.ts`](./packages/clinical-engine/src/rangeEvaluator.ts) (18/18 Vitest unit tests passing) |
| **Differentiated Approach** | Dual-pane split viewer linking extracted biomarker rows to verbatim lines in raw source text; confidence-gated barriers (< 0.70) prevent unverified OCR from propagating to downstream summaries; longitudinal biomarker trajectory with delta percentages. | [`frontend/src/components/DualPaneInspector.tsx`](./frontend/src/components/DualPaneInspector.tsx) |
| **Responsible AI & Safety** | API keys managed strictly on the server (`GEMINI_API_KEY`); patient-facing summaries are educational and non-diagnostic; curated WHO-ATC contraindication radar flags medication and allergy risks before clinical visits. | [`backend/src/routes/clinicalRoutes.ts`](./backend/src/routes/clinicalRoutes.ts) & [`packages/clinical-engine/src/conflictRadar.ts`](./packages/clinical-engine/src/conflictRadar.ts) |

---

## Monorepo Architecture

MedLens is organized as an npm monorepo with strict separation of concerns:

```
medlens/
├── packages/
│   └── clinical-engine/           # Shared, zero-dependency clinical calculation core
│       ├── src/
│       │   ├── rangeEvaluator.ts  # Deterministic reference range math & critical bounds
│       │   ├── conflictRadar.ts   # Curated WHO-ATC drug-allergy & renal contraindication radar
│       │   ├── chronometer.ts     # Multi-report longitudinal deltas and sparkline math
│       │   ├── sbarGenerator.ts   # SBAR physician briefing generator & FHIR R4 exporter
│       │   ├── offlineClinicalParser.ts # Offline regex parser for deterministic fallback
│       │   └── types/clinical.ts  # Shared TypeScript clinical schemas
│       ├── test/                  # Automated Vitest unit test suite (18 unit tests)
│       └── package.json
│
├── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── components/            # DualPaneInspector, PatientHeader, Modals, Summary Cards
│   │   ├── services/
│   │   │   ├── apiClient.ts       # Typed network client calling backend /api/* endpoints
│   │   │   ├── geminiService.ts   # Backend proxy calls for multimodal vision extraction
│   │   │   └── pdfExportService.ts# Clinical briefing PDF generation
│   │   ├── App.tsx                # Main workbench coordinator with live backend sync
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                       # Node.js Express Clinical REST API Microservice
│   ├── src/
│   │   ├── routes/
│   │   │   └── clinicalRoutes.ts  # /api/extract, /api/conflicts, /api/trends, /api/sbar, /api/fhir
│   │   └── server.ts              # Express entrypoint with CORS and dotenv configuration
│   ├── .env.example               # Template for GEMINI_API_KEY server variable
│   └── package.json
│
├── REPORT.md                      # Detailed technical verification report
└── package.json                   # Monorepo workspaces and unified test/dev scripts
```

---

## 5 Key Clinical Innovations

### 1. Deterministic Reference-Range Engine (Zero Hallucination)
- Pure-function evaluator parses intervals (`70 - 99`), less-than (`< 5.7`), greater-than (`> 60`), and qualitative outcomes (`Negative`).
- **Strict Laboratory Grounding:** If a lab report does not print a reference interval, MedLens tags the marker as **"Unspecified by Laboratory"** rather than estimating population averages.
- **Confidence-Gated Review Barrier:** Any reading extracted with OCR confidence $< 0.70$ (e.g. ink smudges, unreadable digits) is tagged with a warning barrier and excluded from automated downstream logic until confirmed by a clinician or patient.

### 2. Dual-Pane Ground-Truth Inspector (HITL)
- **Split-Screen Workspace:** Verbatim source report on the left, structured clinical table on the right.
- **Interactive Pinpointing:** Clicking any row highlights the exact text snippet in the document viewer with its OCR confidence score.
- **Inline Editing & Immutable Audit Log:** Any value or range can be corrected with one click. Every modification is recorded with a timestamp, old value, new value, modifier, and clinical rationale.

### 3. Curated Clinical Safety Radar (WHO-ATC & RxNorm)
- Uses a **curated lookup table covering 5 major therapeutic drug classes** with authentic WHO-ATC codes and RxNorm generic/brand aliases:
  - Penicillins / Beta-Lactams (`ATC-J01C`)
  - Cephalosporins (`ATC-J01D`)
  - Nonsteroidal Anti-inflammatory Drugs (`ATC-M01A`)
  - Sulfonamide Antimicrobials (`ATC-J01E`)
  - Biguanides / Metformin (`ATC-A10BA02`)
- Deterministically flags latent contraindications (e.g., patient with documented Penicillin allergy prescribed Augmentin, or eGFR $< 30$ with Metformin).

### 4. Biomarker Chronometer (Longitudinal Trajectory)
- Pairs current and historical reports to analyze trajectories over time.
- Computes percentage shifts ($\Delta -17.9\%$ on HbA1c), categorizes direction (*Favorable*, *Adverse*, *Stable*), and renders inline SVG micro-sparklines.

### 5. Doctor-Visit Briefing Pack & FHIR R4 Interoperability
- **Printable 1-Page SBAR Brief:** Generates a standardized clinical handoff sheet (Situation, Background, Assessment, Recommendations).
- **HL7 FHIR R4 Standard Export:** Generates an interoperable FHIR R4 Bundle containing `Patient`, `DiagnosticReport`, and `Observation` resources compatible with modern EHR systems.

---

## Quick Start Guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
Clone the repository and install all monorepo dependencies:
```bash
git clone https://github.com/kritishreddy72-jpg/medlens.git
cd medlens
npm install
```

### Running Automated Tests
Run the comprehensive test suite across pure-function engine logic:
```bash
npm test
```

### Running the Application

1. **Start the Backend API:**
```bash
cd backend
# Optional: copy and populate your Gemini API key for live vision extraction
cp .env.example .env
npm run dev
```
Backend API will be live at `http://127.0.0.1:5000/` (Health check: `http://127.0.0.1:5000/api/health`).

2. **Start the Frontend UI:**
```bash
cd frontend
npm run dev
```
Open `http://127.0.0.1:3000/` in your browser.

---

## 4 Clinical Test Scenarios

The top navigation bar contains 4 pre-loaded clinical cases for evaluation:

1. **Comprehensive Metabolic & Lipid Panel:** Demonstrates deterministic interval evaluation, out-of-range flags, and the "Unspecified by Laboratory" safe fallback for Alkaline Phosphatase.
2. **Complete Blood Count with Review Barrier:** Features a 62% confidence ink-smudge on ESR, interactive clarification chips, and human verification.
3. **Latent Drug-Allergy Contraindication:** Tests the curated WHO-ATC lookup table by cross-referencing an Augmentin prescription against a documented Penicillin allergy.
4. **Longitudinal 6-Month Trajectory:** Evaluates dual-report comparison, calculating percentage changes and rendering SVG trendlines for diabetic response to therapy.