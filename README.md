# ENSIA Export AI Engine
### Agentic RAG + Product Sheet Generator (2026 Edition)

The **ENSIA Export AI Engine** is a two-in-one platform:
1. **Compliance Chat** — an agentic RAG assistant that answers export compliance questions using NVIDIA NIM + ChromaDB.
2. **Product Sheet Generator** — an end-to-end pipeline that turns a product photo into a professionally-formatted, multilingual PDF export sheet.

---

## What the tool does

| Page | Function |
|------|----------|
| **Home (app.py)** | Chat with an AI compliance specialist. Upload product images for instant multimodal audit. Ask questions about Algerian export regulations, certifications, and ESG claims. |
| **Product Sheet Generator** | Upload an image → OCR extracts text → Gemini/Groq augments into structured data → Mistral translates → reportlab generates a downloadable PDF. |

---

## Installation

```bash
# 1. Clone / enter the repo
git clone https://github.com/arslenedjellouli/Group_Project.git
cd Group_Project-AgenticRAG_OCR

# 2. Create and activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

> **Arabic PDF support** requires two extra packages already listed in requirements.txt:
> `arabic-reshaper` and `python-bidi`. Install them the same way.

---

## Getting free API keys

| Service | Purpose | Free tier link |
|---------|---------|----------------|
| **NVIDIA NIM** | Compliance agent LLM + Vision OCR | https://build.nvidia.com |
| **Google Gemini** | Product data augmentation (primary) | https://aistudio.google.com/app/apikey |
| **Groq** | Augmentation fallback (llama-3.1-8b-instant) | https://console.groq.com/keys |
| **Mistral AI** | Translation (FR / AR / ES) | https://console.mistral.ai/api-keys/ |

All free tiers are sufficient for development and demo usage.

---

## Environment setup

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
NVIDIA_API_KEY=nvapi-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
COOKIE_PASSWORD=change_this_to_a_strong_secret
```

Keys are loaded via `python-dotenv` — never hardcoded.

---

## Running the app

```bash
streamlit run app.py
```

Open http://localhost:8501. The sidebar shows two pages:
- **app** — Compliance Chat (home page)
- **Product Sheet** — Product Sheet Generator

---

## Pipeline architecture

```
Product Image (JPG/PNG)
        │
        ▼
┌─────────────────────────────────────────────────┐
│  Step 1 — OCR                                   │
│  tools/gemini_ocr.py → analyze_export_product() │
│  NVIDIA Nemotron-Nano-VL vision model            │
└──────────────────────┬──────────────────────────┘
                       │ JSON audit dict
                       ▼
┌─────────────────────────────────────────────────┐
│  Step 2 — RAG context (optional)                │
│  tools/rag.py → query_compliance_documents()    │
│  ChromaDB + NVIDIA Nemotron-Embed-VL            │
│  (silently skipped if DB not initialised)       │
└──────────────────────┬──────────────────────────┘
                       │ compliance context string
                       ▼
┌─────────────────────────────────────────────────┐
│  Step 3 — LLM Augmentation                      │
│  modules/augment.py → augment_product_data()    │
│  Primary : Google Gemini 1.5 Flash              │
│  Fallback: Groq llama-3.1-8b-instant            │
│  Output  : structured dict (name, brand, …)     │
└──────────────────────┬──────────────────────────┘
                       │ structured dict
                       ▼
┌─────────────────────────────────────────────────┐
│  Step 4 — Translation                           │
│  modules/translator.py → translate_product_data()│
│  Mistral AI mistral-small-latest                │
│  Skipped when output language is English        │
│  Arabic: Modern Standard Arabic (MSA) enforced  │
└──────────────────────┬──────────────────────────┘
                       │ translated dict
                       ▼
┌─────────────────────────────────────────────────┐
│  Step 5 — PDF Generation                        │
│  modules/pdf_generator.py → generate_pdf()      │
│  reportlab · header banner · two-column layout  │
│  Arabic: BiDi + reshaper for RTL rendering      │
└──────────────────────┬──────────────────────────┘
                       │ PDF file path
                       ▼
              ⬇️ Download button in Streamlit
```

### Smart caching

Session state avoids redundant API calls:
- **OCR + Augmentation** run once per uploaded image.
- If the user changes the **output language** and clicks Generate again, only Translation and PDF steps re-run.

---

## Folder structure

```
app.py                        # Streamlit entry point (Compliance Chat)
pages/
  1_Product_Sheet.py          # Product Sheet Generator page
modules/
  augment.py                  # LLM augmentation (Gemini + Groq)
  translator.py               # Translation (Mistral AI)
  pdf_generator.py            # PDF layout (reportlab)
tools/
  gemini_ocr.py               # OCR via NVIDIA NIM Vision (existing)
  rag.py                      # RAG tool — ChromaDB (existing)
  browser.py                  # Web browsing tool (existing)
  vision.py                   # Vision analysis tool (existing)
core/
  agent.py                    # LangGraph ReAct agent (existing)
  ingestion.py                # PDF ingestion pipeline (existing)
data/
  raw_pdfs/                   # Place compliance PDFs here for ingestion
  vector_db/                  # ChromaDB persistent store (auto-generated)
  product_sheets/             # Generated PDFs (auto-created)
.env.example                  # Environment variable template
requirements.txt              # All dependencies
```

---

## Initialising the compliance RAG (optional)

Place your compliance PDF documents in `data/raw_pdfs/` and run:

```bash
python core/ingestion.py
```

This ingests the documents into ChromaDB and makes them available for both the Compliance Chat agent and the Product Sheet augmentation step.

---

## Academic context

**Project**: ENSIA 3rd Year Group Project (S2 2026)
**Track**: Advanced Agentic Systems & Multimodal AI
**Status**: Production Ready
