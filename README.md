# ReadFlow.ai 🌸
### Production-Level Multi-Domain Interactive PDF Learning Platform

ReadFlow.ai is an intelligent, multi-domain interactive PDF learning platform built with **Next.js (App Router, TypeScript, Tailwind CSS, Framer Motion)**, **Python FastAPI**, **PyMuPDF**, and **Google Gemini 2.5 SDK with Google Search Grounding**.

---

## 🎨 Color Palette & UI Design System ("Cartoony & Soft Pastel Aesthetic")

| UI Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Base Background** | `#FCE2DB` | Soft pastel parchment base background |
| **Card & Panels** | `#F1C6D3` | Card headers, accent containers, secondary badges |
| **Borders & Highlights** | `#E4A3D4` | Rounded interactive borders, tab frames, focus rings |
| **Primary Actions** | `#C295D8` | Main action buttons, active tabs, highlight indicators |
| **Text Contrast** | `#3D2347` / `#6E497A` | High-contrast readable typography |

---

## 🏗️ Folder Structure

```
d:/readflow.ai/
├── .env                              # Root environment config (GEMINI_API_KEY)
├── README.md                         # Architecture and run guide
│
├── backend/                          # FastAPI Backend Application
│   ├── .env                          # Backend environment variables
│   ├── requirements.txt              # PyMuPDF, google-genai, fastapi, uvicorn
│   ├── uploads/                      # Uploaded PDFs and rendered canvas cache
│   └── app/
│       ├── __init__.py
│       ├── main.py                   # FastAPI app entrypoint with CORS
│       ├── config.py                 # Pydantic Settings & Gemini Model configs
│       ├── schemas/                  # Pydantic Schemas
│       │   ├── __init__.py
│       │   ├── document.py           # DocumentMetadata, PageInfo
│       │   ├── analysis.py           # DocumentSummary, SpecializedTerm
│       │   └── explore.py            # DeepSearchResponse, VisualGenerateResponse
│       ├── services/                 # Core Business Logic
│       │   ├── __init__.py
│       │   ├── pdf_service.py        # PyMuPDF text & page image extraction
│       │   ├── gemini_service.py     # Gemini 2.5 synthesis & Google Search Grounding
│       │   └── sample_generator.py   # Multi-domain sample PDF generator (6 domains)
│       └── routers/                  # API Endpoints
│           ├── __init__.py
│           ├── documents.py          # /api/documents (upload, delete, samples, pages)
│           ├── analysis.py           # /api/analysis (document synthesis & taxonomy)
│           └── explore.py            # /api/explore (on-demand search & SVG generation)
│
└── frontend/                         # Next.js App Router (TypeScript + Tailwind)
    ├── package.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx                # Base HTML layout & fonts
    │   ├── page.tsx                  # Main interactive workspace
    │   └── globals.css               # Pastel design system tokens & animations
    ├── components/
    │   ├── Navbar.tsx                # Brand, document badge, domain indicator, actions
    │   ├── SummaryPanel.tsx          # Step 2: Left-side classification & summary
    │   ├── PdfViewerPanel.tsx        # Step 3: Interactive reader with selective highlights
    │   ├── DetailDrawer.tsx          # Step 4: Animated right-side popup drawer
    │   ├── UploadModal.tsx           # Step 1: Drag-and-drop & 6-domain sample showcase
    │   └── ApiKeyModal.tsx           # Runtime Gemini API key configuration
    └── lib/
        ├── api.ts                    # Type-safe API client
        └── types.ts                  # Shared TypeScript interfaces
```

---

## 🚀 Supported Disciplines & Domains

ReadFlow.ai dynamically detects and processes documents across 6 core academic and technical fields:

1. **Medical & Healthcare**: Clinical pathophysiology, Wiggers cardiac cycle diagrams, ejection fraction, endothelial shear stress.
2. **Education & Pedagogy**: Cognitive load theory (intrinsic, extraneous, germane), Vygotsky's ZPD, spiral curriculum design.
3. **Industrial & Supply Chain**: Kanban pull systems, Theory of Constraints bottlenecks, OEE measurement, takt time synchronization.
4. **Finance & Economics**: Discounted Cash Flow (DCF), WACC hurdle rates, CAPM Beta, Markowitz efficient frontier.
5. **Mathematics & Statistics**: Singular Value Decomposition (SVD), Bayesian posterior updating, spectral radius, SGD.
6. **Scientific Research (Physics & Chemistry)**: Frontier Molecular Orbital (HOMO-LUMO) overlap, Gibbs free energy, Hamiltonian wave operators, spectroscopy.

---

## ⚡ Workflow & Key Features

### 1. Step 1 (Upload & Dynamic File Management)
- Users can upload any custom PDF via drag-and-drop or file picker.
- Users can dynamically **delete** the active document at any time and upload a new one.
- Built-in instant showcase featuring 6 pre-generated sample documents for immediate testing.

### 2. Step 2 (Smart Extraction & Classification Panel - Left Side)
- PyMuPDF extracts text page-by-page.
- Google Gemini removes boilerplate and conversational fluff to produce an **Executive Summary** and **Core Thesis**.
- Intelligently detects and tags **Specialized Terms** into categories and distinguishes between:
  - `simple_concept`: Text definitions, formulas, or standard vocabulary.
  - `visual_concept`: Complex systems, flowcharts, anatomical cycles, or molecular structures that require a visual schematic.

### 3. Step 3 (Selective Interaction & On-Demand Image Generation)
- Rather than underlining every word, terms are **selectively highlighted**.
- Text definitions and mathematical formulas load inline on selection.
- **Image generation and web search lookups are strictly on-demand only** when the user explicitly clicks:
  - **"Launch Deep Search"**: Queries Gemini Grounding with Google Search.
  - **"Generate Pastel Schematic"**: Generates a responsive, cartoony vector SVG diagram styled in `#FCE2DB`, `#F1C6D3`, `#E4A3D4`, and `#C295D8`.

### 4. Step 4 (Animated Right-Side Popup Drawer)
- Slides in smoothly with Framer Motion spring physics (`stiffness: 320, damping: 28`).
- Displays definition, excerpted context directly from the PDF page, formula block, live web citations, and downloadable SVG schematic.

---

## 🛠️ How to Run Locally

### 1. Backend (FastAPI)
```bash
# In d:/readflow.ai/backend:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend (Next.js)
```bash
# In d:/readflow.ai/frontend:
npm run dev
```

Visit **`http://localhost:3000`** in your browser.
Configure your `GEMINI_API_KEY` in `d:/readflow.ai/.env` or via the key modal in the top navigation bar.
