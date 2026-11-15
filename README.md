# TradePilot

TradePilot is an AI-assisted export workspace for creating product sheets,
reviewing compliance information, and preparing multilingual PDF exports.

The repository contains:

- A React/Vite workspace for product creation, editing, translation, and chat.
- A Django API for product persistence and AI pipeline endpoints.
- A Streamlit application for the original compliance-chat and product-sheet
  workflows.
- Optional RAG ingestion and retrieval over local compliance documents.

## Features

- Product wizard with image-based OCR and AI enrichment.
- Product editor with multilingual translation and PDF generation.
- Compliance chat backed by retrieval and agent tools.
- Persistent product records through Django and SQLite.
- Configurable API authentication using signed, expiring bearer tokens.
- Local-first development with no required third-party service for the UI shell.

AI calls require the relevant provider keys and are intentionally not made
without configuration.

## Technology

- Python 3.11+ and Django
- Streamlit
- React 19, Vite, Tailwind CSS, and Zustand
- LangChain/LangGraph and ChromaDB
- NVIDIA NIM, Gemini, Groq, and Mistral integrations
- SQLite for local development

## Quick start

### 1. Configure Python

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a strong `DJANGO_SECRET_KEY`, `AUTH_EMAIL`, and `AUTH_PASSWORD` in `.env`.
Add the provider keys for the AI features you plan to use.

### 2. Initialize the API database

```powershell
python manage.py migrate
python manage.py check
```

The local SQLite database is generated at runtime and is intentionally ignored
by Git. Never commit it or uploaded media.

### 3. Start the Django API

```powershell
python manage.py runserver 127.0.0.1:8000
```

The API is available at `http://127.0.0.1:8000/api/`.

### 4. Start the React frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`. Set
`VITE_API_URL=http://127.0.0.1:8000/api` when the frontend is hosted separately;
otherwise the default `/api` path works with a reverse proxy.

### 5. Optional Streamlit application

```powershell
streamlit run app.py
```

Open `http://localhost:8501`.

## RAG ingestion

Place approved compliance PDFs in `data/raw_pdfs/` and run:

```powershell
python core/ingestion.py
```

The generated Chroma database is local runtime data and is excluded from Git.
NVIDIA credentials are required for embeddings and multimodal extraction.

## Project structure

```text
api/                    Django product and AI API
core/                   Agent orchestration and document ingestion
ensia_project/          Django settings and URL configuration
frontend/               React/Vite application
modules/                Augmentation, translation, and PDF generation
pages/                  Streamlit product-sheet page
tools/                  Browser, OCR, RAG, and vision tools
specs/                  Existing technical specifications
```

## Testing and validation

```powershell
$env:DJANGO_SECRET_KEY = "local-test-secret"
$env:AUTH_EMAIL = "admin@example.com"
$env:AUTH_PASSWORD = "local-test-password"
$env:DEBUG = "false"
python manage.py check
python -m compileall -q .
cd frontend
npm run build
```

The repository currently has focused smoke validation but no broad automated
test suite. External AI behavior requires provider-backed integration tests and
should be tested with non-production credentials.

## Security

- Copy `.env.example`; do not commit `.env`.
- Rotate any credential that has ever been exposed outside a secret manager.
- Use HTTPS in deployed environments.
- Configure explicit `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
- The browser tool only accepts HTTPS and blocks private, loopback, link-local,
  and reserved IP addresses.
- Product uploads, SQLite data, logs, vector stores, and generated files are
  ignored by default.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
