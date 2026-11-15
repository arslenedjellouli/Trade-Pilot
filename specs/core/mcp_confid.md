# Spec: MCP Documentation Bridge

##  Goal
Enable the Agent and Copilot to fetch "Just-in-Time" documentation for NVIDIA NIM and LangChain.

## 🛠️ Configuration
- **Server 1:** `context7` (Docs Fetcher)
- **Server 2:** `github` (Repo Explorer)
- **Transport:** stdio (Local)

## 🔧 Integration Logic
1. When a new LangChain component is needed, Copilot calls `context7.fetch_docs("langchain_nvidia_ai_endpoints")`.
2. The fetched Markdown is used to write the `.py` file.
3. The documentation is cross-referenced in the `specs/` folder.