# TradePilot

TradePilot is an AI-assisted export workspace for turning product information
and images into multilingual, export-ready product sheets. It combines a
React workspace, a Django API, AI enrichment services, compliance retrieval,
and an optional Streamlit interface.

It is designed for teams that need to move from a product image or rough
product information to a reviewed export document. The application keeps the
generated product record editable: AI suggestions are inputs for human review,
not a replacement for approval.

## What the project does

### Product workspace

The React frontend provides:

- **Dashboard:** browse saved products, see their current state, and open a
  product for editing.
- **Product wizard:** upload a product image, extract visible information,
  enrich the record with AI, review the result, and create a product.
- **Product editor:** correct names, descriptions, specifications, pricing,
  compliance fields, and other generated values before exporting.
- **Translation:** produce localized product content in English, French,
  Arabic, or Spanish.
- **PDF export:** generate a formatted product sheet suitable for sharing or
  further review.
- **Compliance chat:** ask export and compliance questions using the local
  knowledge base, with optional image context for visual checks.

The dashboard opens directly without a login in the current local/demo
configuration. This is intentional for the supplied demonstration workflow;
see [Security and privacy](#security-and-privacy) before deploying it on a
shared or public network.

### AI product pipeline

When an image is submitted through the wizard, the API runs this pipeline:

1. **OCR and visual audit** using the configured NVIDIA vision service.
2. **Compliance context retrieval** from the local ChromaDB knowledge base.
3. **Product enrichment** using Gemini, with Groq available as a fallback.
4. **Translation** through Mistral when a non-English language is selected.
5. **PDF generation** using ReportLab, including Arabic text shaping support.

AI services are optional during setup, but their API keys are required for
OCR, enrichment, translation, chat, and RAG features.

### What each service contributes

| Capability | Input | Result | Main dependency |
|---|---|---|---|
| OCR and visual audit | Product image | Extracted text and visual observations | NVIDIA vision service |
| Compliance retrieval | Product question or image context | Relevant passages from approved PDFs | ChromaDB + embeddings |
| Product enrichment | OCR output and retrieved context | Structured product fields | Gemini, with Groq fallback |
| Translation | Product fields and target language | Localized product content | Mistral |
| Product export | Reviewed product record | PDF product sheet | ReportLab |

### Two available interfaces

| Interface | Purpose | URL |
|---|---|---|
| React + Django | Main product workspace and API | `http://localhost:5173` |
| Streamlit | Original compliance chat and product-sheet workflow | `http://localhost:8501` |

The React application is the recommended interface for new development. The
Streamlit application remains available for the original workflow and demos.

## Quick start

The shortest local setup is:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
```

Start the API in one terminal:

```powershell
python manage.py runserver 127.0.0.1:8000
```

Start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Then open `http://127.0.0.1:5173/`. The frontend development server proxies
API and media requests to Django, so both processes must be running.

## Architecture

```text
React/Vite frontend
        |
        | JSON, multipart uploads, SSE chat
        v
Django API
  |             \
  |              +--> SQLite product records
  |
  +--> OCR -> RAG context -> AI enrichment -> translation -> PDF
                    |
                    +--> ChromaDB local compliance knowledge base

Streamlit app ---> shared core/tools/modules
```

## Technology

- **Frontend:** React 19, React Router, Vite, Tailwind CSS, Zustand
- **Backend:** Django 6, SQLite, Django CORS headers
- **AI orchestration:** LangChain, LangGraph, NVIDIA NIM
- **AI providers:** NVIDIA, Google Gemini, Groq, Mistral
- **Documents and output:** ChromaDB, PyMuPDF, ReportLab
- **Alternative UI:** Streamlit

## Installation

### Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- Provider API keys for the AI features you want to enable

### Python environment

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` before starting Django. At minimum, configure:

```env
DJANGO_SECRET_KEY=use-a-long-random-value
COOKIE_PASSWORD=use-a-separate-cookie-secret
```

Add `NVIDIA_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, and
`MISTRAL_API_KEY` for the corresponding AI features.

#### Configuration reference

| Variable | Required for | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django | Secret used by Django security features |
| `COOKIE_PASSWORD` | Streamlit | Secret for Streamlit's cookie handling |
| `NVIDIA_API_KEY` | OCR, RAG, visual audit | NVIDIA model access |
| `GEMINI_API_KEY` | Enrichment | Gemini product-field generation |
| `GROQ_API_KEY` | Enrichment fallback | Alternative model provider |
| `MISTRAL_API_KEY` | Translation | Translation requests |
| `ALLOWED_HOSTS` | Deployment | Hosts accepted by Django |
| `CORS_ALLOWED_ORIGINS` | Separate frontend/API | Browser origins allowed to call the API |

Only configure the provider keys for features you intend to use. Never place
real credentials in the repository or in frontend code.

### Database and API

```powershell
python manage.py migrate
python manage.py check
python manage.py runserver 127.0.0.1:8000
```

The API is served below `http://127.0.0.1:8000/api/`. The database is created
locally as `db.sqlite3` and is intentionally ignored by Git.

### React frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/media` to Django on
port 8000, so no frontend environment variable is needed for local development.

For a separately hosted API, create `frontend/.env`:

```env
VITE_API_URL=https://api.example.com/api
```

To create a production bundle:

```powershell
cd frontend
npm run build
npm run preview
```

### Streamlit interface

With the Python environment activated:

```powershell
streamlit run app.py
```

Open `http://localhost:8501`.

## Typical user workflow

1. Open the React frontend; it loads directly into the dashboard.
2. Select **New product** and upload a product image.
3. Run the OCR and enrichment pipeline.
4. Inspect the extracted text, detected attributes, and compliance context.
5. Correct or complete the generated fields before saving.
6. Open the saved product from the dashboard.
7. Translate the product when a target market requires another language.
8. Download the reviewed PDF product sheet.
9. Use **Compliance Chat** to investigate export questions or audit another
   image.

### Expected outputs

- A saved product record in the local SQLite database.
- Product images under the local media directory.
- A localized, editable product representation.
- A generated PDF available from the product editor.
- Chat responses streamed progressively to the browser.

## RAG knowledge base

To use compliance retrieval:

1. Place approved PDF documents in `data/raw_pdfs/`.
2. Ensure `NVIDIA_API_KEY` is configured.
3. Run:

   ```powershell
   python core/ingestion.py
   ```

The generated ChromaDB files in `data/vector_db/` are local runtime data and
are excluded from Git. Re-run ingestion when the source documents change.

The quality of retrieval depends on the source documents. Use approved,
up-to-date compliance documents and treat retrieved passages as assistance
that still requires a qualified review.

## API overview

The current frontend/API mode is intentionally open for local demos and
development. Put the API behind a trusted network or add production
authentication before exposing it publicly.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/products/` | List saved products |
| `POST` | `/api/products/` | Create a product |
| `GET/PUT/DELETE` | `/api/products/<id>/` | Read, update, or delete a product |
| `POST` | `/api/ai/pipeline/` | Run image OCR and enrichment |
| `POST` | `/api/ai/generate-pdf/` | Generate a product PDF |
| `POST` | `/api/ai/translate/` | Translate product data |
| `POST` | `/api/chat/message/` | Stream compliance chat responses |
| `POST` | `/api/chat/ocr/` | Run an image compliance audit |

## Project structure

```text
api/                    Django product and AI API
core/                   Agent orchestration and PDF ingestion
ensia_project/          Django settings and URL configuration
frontend/               React/Vite application
modules/                AI augmentation, translation, and PDF generation
pages/                  Streamlit product-sheet page
tools/                  Browser, OCR, RAG, and vision tools
data/raw_pdfs/          Local source documents for RAG ingestion
specs/                  Technical specifications
```

## Data lifecycle

- Product records are stored in the local SQLite database.
- Uploaded images are served through Django media URLs.
- Images uploaded only for standalone OCR are removed after processing.
- Product-associated images are removed when their product is deleted.
- Vector indexes and generated runtime files are local and ignored by Git.
- No provider API key should ever be sent from the browser; provider calls are
  made by the backend.

## Testing and quality checks

Run the backend checks from the repository root:

```powershell
$env:DJANGO_SECRET_KEY = "local-test-secret"
$env:DEBUG = "false"
python manage.py test
python manage.py check
python -m compileall -q .
```

Run frontend checks:

```powershell
cd frontend
npm run build
npm audit
```

The test suite includes product API and response-shape regressions. Provider-backed AI behavior should be tested separately with
non-production credentials.

## Current limitations

- AI output depends on external provider availability, model behavior, and
  configured quotas.
- The default SQLite setup is intended for local development and small demos,
  not high-concurrency production workloads.
- The current dashboard/API mode has no user authentication or authorization.
- Compliance answers are informational and must be reviewed against the
  applicable regulations and source documents.

## Security and privacy

- Never commit `.env`, API keys, passwords, SQLite databases, uploads, logs, or
  vector-store files.
- Rotate credentials immediately if they are exposed.
- Configure explicit `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in deployment.
- Use HTTPS for deployed frontend/API traffic.
- Uploaded images are size- and extension-validated; standalone OCR uploads
  are deleted after processing.
- The browser tool only accepts HTTPS and blocks private, loopback, link-local,
  and reserved IP addresses.
- The public dashboard mode is suitable only for local or trusted-network
  demonstrations. Add authentication, authorization, HTTPS, and production
  deployment controls before exposing the API to untrusted users.

## License

TradePilot is released under the MIT License. See [LICENSE](LICENSE).
