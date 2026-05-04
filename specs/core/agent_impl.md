# Implementation: Agentic RAG Orchestrator

## 📖 Purpose
The `agent.py` module serves as the brain of the ENSIA Export AI Engine. It uses **LangGraph** (the 2026 industry standard) to autonomously orchestrate tools through a state-based ReAct loop.

## 🛠️ Logic
1.  **State Management**: Uses LangGraph's `create_react_agent` to manage the conversation state and tool execution cycle with `nvidia/llama-3.3-70b-instruct`.
2.  **Tool Selection**:
    -   **PDF Knowledge**: Calls `query_compliance_documents` for internal regulatory data.
    -   **Web Verification**: Calls `browse_link_content` if a link is found in the RAG context or if real-time data is needed.
    -   **Visual Review**: Calls `analyze_compliance_document_image` if a document asset or diagram is provided.
3.  **Iteration**: The agent can perform multi-step reasoning (e.g., "Find the regulation in PDF" -> "Check the link mentioned in that regulation" -> "Summarize").
4.  **Final Response**: Synthesizes all tool observations into a single, professional compliance answer.

## 📦 Dependencies
- `langgraph`: Modern agentic orchestration framework.
- `langchain_nvidia_ai_endpoints`: For the Nemotron 70B reasoning model.

## 🚀 Usage
The agent can be started in interactive mode:
```powershell
python core/agent.py
```

## ⚖️ Safety & Precision
- **Temperature**: Set to `0.1` to minimize hallucinations and prioritize factual accuracy in legal contexts.
- **Max Iterations**: Capped at 10 to prevent infinite loops while allowing for complex verification.
