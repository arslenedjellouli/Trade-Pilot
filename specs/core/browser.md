# Spec: Contextual Web Browser

## 🎯 Goal
Allow the agent to visit specific URLs found in the PDF context to verify real-time data.

## 🛠️ Logic
1. Receive a URL from the Agent.
2. Use `AsyncHtmlLoader` or `Playwright` (via LangChain) to fetch the page.
3. **Chunking/Cleaning:** Use `BeautifulSoupTransformer` to remove CSS/Scripts and only return meaningful text.
4. **Validation:** LLM compares the live web text with the PDF text.

## 🔧 Components
- `from langchain_community.document_loaders import AsyncHtmlLoader`
- `from langchain_community.document_transformers import BeautifulSoupTransformer`