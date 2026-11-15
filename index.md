# ENSIA Export AI Engine - Knowledge Index

| Module | File | Specification | Status |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | `core/agent.py` | [agent_impl.md](specs/core/agent_impl.md) | ✅ Complete (LangGraph) |
| **RAG Tool** | `tools/rag.py` | [rag.md](specs/core/rag.md) | ✅ Complete |
| **Gemini OCR** | `tools/gemini_ocr.py` | [vision.md](specs/core/vision.md) | ✅ Integrated |
| **Ingestion** | `core/ingestion.py` | [ingestion.md](specs/core/ingestion.md) | ✅ Multimodal Ready |
| **Web Browser** | `tools/browser.py` | [browser.md](specs/core/browser.md) | ✅ Complete |
| **UI/UX** | `app.py` | [ui.md](specs/core/ui.md) | ✅ Premium Ready |

## ⚙️ 2026 Tech Stack
- **Reasoning Core:** NVIDIA NIM (`meta/llama-3.1-8b-instruct`)
- **Multimodal Audit:** NVIDIA NIM (`nvidia/nemotron-nano-12b-v2-vl`)
- **Embeddings:** NVIDIA NIM (`nvidia/llama-nemotron-embed-vl-1b-v2`)
- **Orchestration:** LangGraph (Stateful ReAct Graph)
- **Vector Store:** ChromaDB (Local Persistent)
- **Persistence:** Local JSON (`data/chat_log.json`) + Optional Cookies

## 🗓️ Development Timeline (May 2026)
- **[2026-05-04]:** 🚀 **Final Delivery**: Integrated Gemini OCR, Full Chat Persistence, and Premium CSS styling.
- **[2026-05-04]:** ⚡ Switched to Llama 8B for high-speed agentic loops.
- **[2026-05-04]:** 🎨 Launched Premium Streamlit UI with Teletype streaming and Citation Cards.
- **[2026-05-04]:** 🔧 Migrated to LangGraph and resolved NVIDIA SDK duplicate model errors.
- **[2026-05-04]:** 👁️ Implemented Multimodal Ingestion for scanned compliance PDFs.

## 📂 Key Data Paths
- `data/raw_pdfs/`: Source compliance documents.
- `data/vector_db/`: Persistent ChromaDB store.
- `data/chat_log.json`: Persistent conversation history.
- `data/prompt_history.json`: Persistent prompt library.
- `specs/`: Detailed technical documentation for each component.