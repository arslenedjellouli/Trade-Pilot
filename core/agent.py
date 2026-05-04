import os
from langgraph.prebuilt import create_react_agent
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from dotenv import load_dotenv

# Import tools from our local tools package
from tools.rag import query_compliance_documents
from tools.browser import browse_link_content
from tools.gemini_ocr import analyze_export_product

# Load environment variables
load_dotenv()

# --- Configuration ---
# Llama-3.1-8B is exceptionally fast and bypasses the "Duplicate Model" SDK bug
AGENT_MODEL = "meta/llama-3.1-8b-instruct"

def initialize_ensia_agent():
    """
    Initializes the Agentic RAG Orchestrator using a fast, stable 8B model.
    """
    print(f"🚀 Initializing Stable High-Speed ENSIA Export AI Agent ({AGENT_MODEL})...")
    
    try:
        # Initialize NVIDIA NIM LLM
        llm = ChatNVIDIA(
            model=AGENT_MODEL,
            temperature=0.1
        )
        
        # Define the Toolset
        tools = [
            query_compliance_documents,
            browse_link_content,
            analyze_export_product
        ]
        
        # Define the System Instruction for structured, professional output
        system_prompt = (
            "You are the ENSIA Export AI Engine, a high-precision compliance specialist.\n"
            "### PRIME DIRECTIVES:\n"
            "1. ALWAYS prioritize information found in the 'TECHNICAL PRODUCT AUDIT (CONTEXT)' block. "
            "DO NOT call the 'analyze_export_product' tool if the audit is already provided.\n"
            "2. ANTI-HALLUCINATION: DO NOT guess or invent URLs. ONLY provide a clickable link if it was EXPLICITLY found in a tool's output (RAG or Web). "
            "If a URL is not provided by a tool, do not create one (e.g., do not turn 'BrandX' into 'brandx.com').\n"
            "3. Use Markdown headers (###) for clear sections.\n"
            "4. Use bullet points for regulatory requirements or technical details.\n"
            "5. If research reveals REAL URLs, list them under '### 🔗 Sources & References' using: "
            "<div class='source-card'>[Link Text/URL]</div>\n"
            "6. Keep the tone concise, authoritative, and helpful."
        )
        
        # Create the LangGraph React Agent with the system prompt
        agent_executor = create_react_agent(
            model=llm,
            tools=tools,
            prompt=system_prompt
        )
        
        return agent_executor

    except Exception as e:
        print(f"❌ Initialization Failed: {e}")
        raise e

if __name__ == "__main__":
    # Interactive Demo Mode
    ensia_agent = initialize_ensia_agent()
    print("✅ Fast Agent Ready.")
    
    while True:
        user_query = input("\n👤 User: ")
        if user_query.lower() in ["exit", "quit"]:
            break
        
        try:
            for chunk, metadata in ensia_agent.stream(
                {"messages": [("user", user_query)]}, 
                stream_mode="messages"
            ):
                if hasattr(chunk, "content"):
                    print(chunk.content, end="", flush=True)
            print()
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
