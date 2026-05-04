import os
from langchain_community.vectorstores import Chroma
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain.tools import tool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
VECTOR_DB_DIR = "data/vector_db"
EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2"

import streamlit as st

# Initialize Embeddings and Vector Store as cached resources
@st.cache_resource
def get_vector_db():
    embeddings = NVIDIAEmbeddings(
        model=EMBEDDING_MODEL,
        truncate="NONE"
    )
    return Chroma(
        persist_directory=VECTOR_DB_DIR,
        embedding_function=embeddings
    )

vector_db = get_vector_db()

@tool
def query_compliance_documents(query: str) -> str:
    """
    Search the internal ENSIA Export Compliance database for regulations, 
    legal articles, and internal procedures. Use this tool for any question 
    regarding export laws or compliance rules.
    """
    try:
        # Retrieve top 5 relevant chunks
        results = vector_db.similarity_search(query, k=5)
        
        if not results:
            return "No relevant compliance documents found for this query."

        formatted_results = []
        for doc in results:
            source = doc.metadata.get("source_file", "Unknown")
            page = doc.metadata.get("page", "?")
            content = doc.page_content
            has_links = doc.metadata.get("has_links", False)
            links = doc.metadata.get("link_references", "")

            entry = f"[SOURCE: {source}, PAGE: {page}]\n"
            entry += f"CONTENT: {content}\n"
            if has_links and links:
                entry += f"[LINKS FOUND]: {links}\n"
            entry += "-" * 40
            formatted_results.append(entry)

        return "\n\n".join(formatted_results)

    except Exception as e:
        return f"Error querying the database: {e}"

if __name__ == "__main__":
    # Test call
    test_query = "What are the rules for export compliance?"
    print(f"🔍 Testing RAG Tool with query: '{test_query}'")
    print(query_compliance_documents.run(test_query))
