# TradePilot

TradePilot is an AI-assisted export workspace for turning product information
and images into multilingual, export-ready product sheets. It combines a
React workspace, a Django API, AI enrichment services, compliance retrieval,
and an optional Streamlit interface.

## What the project does

### Product workspace

The React frontend provides:

- A dashboard for saved products with direct access in local/demo mode.
- A product wizard for image upload, OCR, AI enrichment, and product creation.
- A product editor for corrections, translations, and PDF downloads.
- Compliance chat with optional product-image context.
- Localized product data for English, French, Arabic, and Spanish.

### AI product pipeline

When an image is submitted through the wizard, the API runs this pipeline:

1. **OCR and visual audit** using the configured NVIDIA vision service.
2. **Compliance context retrieval** from the local ChromaDB knowledge base.
3. **Product enrichment** using Gemini, with Groq available as a fallback.
4. **Translation** through Mistral when a non-English language is selected.
5. **PDF generation** using ReportLab, including Arabic text shaping support.

AI services are optional during setup, but their API keys are required for
OCR, enrichment, translation, chat, and RAG features.

### Two available interfaces

| Interface | Purpose | URL |
|---|---|---|
| React + Django | Main product workspace and API | `http://localhost:5173` |
| Streamlit | Original compliance chat and product-sheet workflow | `http://localhost:8501` |

The React application is the recommended interface for new development. The
Streamlit application remains available for the original workflow and demos.

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
2. Select **Products** and create a product.
3. Upload a product image, then run the OCR/AI pipeline.
4. Review and correct the generated fields.
5. Save the product.
6. Open the product editor to translate content or download a PDF.
7. Use **Compliance Chat** for export questions and optional image audits.

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

## License

TradePilot is released under the MIT License. See [LICENSE](LICENSE).
