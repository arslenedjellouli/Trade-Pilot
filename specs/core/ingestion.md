# Spec: NVIDIA-Optimized Ingestion

## 🎯 Goal
Convert raw PDFs in `data/raw_pdfs` into an NVIDIA-compatible Vector Store.

## 🛠️ Logic
1. Scan `data/raw_pdfs`.
2. Load via `PyPDFLoader`.
3. Chunking: 1024/150 (Recursive).
4. Embedding: Generate vectors using `nvidia/llama-nemotron-embed-vl-1b-v2`.
5. Storage: Persistent `Chroma` database in `data/vector_db`.

## 🔧 Components
- `from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings`
- `from langchain_community.vectorstores import Chroma`
## 🔗 Link Handling Logic
- **Detection:** During PDF parsing, identify strings starting with `http` or `www`.
- **Contextualization:** Do not store links in a separate file. Keep them inside the text chunks.
- **Metadata Enrichment:** - For each chunk containing a link, add a metadata field `has_links: True`.
    - Create a metadata field `link_references: ["url1", "url2"]`.
- **Reasoning:** This allows the Agent to see the link *and* the surrounding legal text simultaneously, enabling the "thought" process: *"I see the 2024 regulation here and a link to the live portal; I will use the Browser Tool to check for 2026 updates."*