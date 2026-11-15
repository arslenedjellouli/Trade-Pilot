# Implementation: NVIDIA-Optimized Ingestion Pipeline

## 📖 Purpose
This module implements the automated ingestion of raw PDF documents into a persistent ChromaDB vector store. It specifically optimizes for NVIDIA NIM architectures by using the `llama-nemotron-embed-vl-1b-v2` model and enriches metadata to support agentic web-lookup decisions.

## 🛠️ Logic
1.  **PDF Loading:** Uses `PyPDFLoader` to extract text and page numbers from all `.pdf` files in `data/raw_pdfs`.
2.  **Recursive Chunking:** Implements `RecursiveCharacterTextSplitter` with a window size of **1024** and overlap of **150** to maintain legal/technical context.
3.  **Metadata Link Extraction:**
    -   Scans each chunk for URL patterns (`http`, `https`, `www`).
    -   Sets `has_links: True` if any are found.
    -   Stores found URLs in the `link_references` list in ChromaDB metadata.
4.  **Vectorization:** Processes chunks through the NVIDIA NIM Embedding endpoint.
5.  **Persistence:** Saves the resulting index to `data/vector_db` for zero-cost reuse by the RAG tool.

## 📦 Dependencies
- `langchain_nvidia_ai_endpoints`: For high-performance NVIDIA embeddings.
- `langchain_community`: For PDF loading and ChromaDB integration.
- `python-dotenv`: To load the NVIDIA_API_KEY from .env.
- `pypdf`: Required by PyPDFLoader.
- `chromadb`: For persistent vector storage.

## 🚀 Usage
To run the ingestion pipeline manually:
```powershell
# Activate venv if not already active
..\venv\Scripts\activate

# Run ingestion
python core/ingestion.py
```

## 📊 Metadata Schema
Each document in the vector store contains:
| Field | Type | Description |
| :--- | :--- | :--- |
| `source_file` | string | Original filename. |
| `page` | integer | Page number in the PDF. |
| `has_links` | boolean | Flag for presence of external URLs. |
| `link_references` | list | Array of extracted URLs. |
