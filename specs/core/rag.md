# Spec: Export Compliance RAG Tool

## 🎯 Goal
Provide the Agent with a high-precision tool to query the persistent `ChromaDB` vector store containing export regulations and internal compliance documents.

## 🛠️ Logic
1.  **Initialize**: Connect to the `data/vector_db` using the same `NVIDIAEmbeddings` model (`llama-nemotron-embed-vl-1b-v2`).
2.  **Search**: Execute a similarity search with a default `k=5` chunks.
3.  **Metadata Extraction**: 
    -   Format each retrieved chunk with its `source_file` and `page`.
    -   Specifically flag if `has_links` is true and provide the `link_references`.
4.  **Context Construction**: Return a structured string to the Agent that separates text from metadata, enabling the Agent to "see" external links for potential web verification.

## 🔧 Components
- `from langchain_community.vectorstores import Chroma`
- `from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings`
- `from langchain.tools import tool`

## 📊 Output Format
The tool should return results in this format:
```text
[SOURCE: filename.pdf, PAGE: 5]
CONTENT: ... (chunk text) ...
[LINKS FOUND]: url1, url2 (if applicable)
----------------------------------------
```

## 🚀 Usage
The tool will be imported by `core/agent.py` and added to the Agent's toolset.
