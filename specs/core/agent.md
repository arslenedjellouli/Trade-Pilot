# Spec: Agentic RAG Orchestrator (NVIDIA)

## 🎯 Goal
A ReAct agent that determines if a query needs PDF retrieval, Web search, or Vision analysis.

## 🛠️ Logic Flow
1. Receive input.
2. Search `VectorDB` (Internal documents).
3. If info is missing/outdated, trigger `DuckDuckGo` or `Browser`.
4. If image provided, trigger `Vision`.
5. Final check: Ensure answer matches Export Compliance standards.

## 🔧 Components
- `from langchain_nvidia_ai_endpoints import ChatNVIDIA`
- `AgentType: ZERO_SHOT_REACT_DESCRIPTION`