# ⚖️ Project Rules of Engagement

## 1. Documentation Synchronicity
- Every `.py` file must have a corresponding `.md` documentation file in `/specs`.
- Format for documentation: `## Purpose`, `## Logic`, `## Dependencies`, `## Usage`.

## 2. Index Management
- Every new file or major update must be logged in `index.md`.
- `index.md` must maintain the link between a Python module and its Spec.

## 3. NVIDIA Integration Standards
- LLM: `meta/llama-3.1-8b-instruct`
- Embeddings: `nvidia/llama-nemotron-embed-vl-1b-v2`
- All calls must use `langchain_nvidia_ai_endpoints`.

## 4. Chunking Strategy
- Type: RecursiveCharacterTextSplitter.
- Size: 2048 characters.
- Overlap: 200 characters.
- Reasoning: Large enough to keep context of legal articles, small enough for high precision.