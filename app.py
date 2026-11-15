import streamlit as st
import os
import time
import json
try:
    from streamlit_cookies_manager import EncryptedCookieManager
    HAS_COOKIES = True
except ImportError:
    HAS_COOKIES = False

from core.agent import initialize_ensia_agent
from tools.gemini_ocr import analyze_export_product
from langchain_core.messages import AIMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Page Configuration ---
st.set_page_config(
    page_title="Export AI Engine",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom CSS for Premium Aesthetics ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .stApp {
        background: radial-gradient(circle at 10% 20%, rgb(15, 15, 15) 0%, rgb(30, 30, 30) 90.2%);
        color: #e0e0e0;
    }
    
    /* Header Styling */
    .main-header {
        font-size: 3rem;
        font-weight: 800;
        background: -webkit-linear-gradient(#76b900, #ffffff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: rgba(20, 20, 20, 0.8) !important;
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(118, 185, 0, 0.2);
    }
    
    /* Chat Message Bubbles */
    .stChatMessage {
        border-radius: 12px;
        padding: 0.8rem;
        margin-bottom: 0.8rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .stChatMessage p, .stChatMessage li {
        font-size: 0.92rem !important; /* Slightly smaller, more professional font */
        line-height: 1.5;
        color: #f0f0f0;
    }
    
    .stChatMessage a {
        color: #76b900 !important;
        text-decoration: underline !important;
        font-weight: 600;
    }
    
    .stChatMessage h3 {
        font-size: 1.1rem !important;
        color: #76b900 !important;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }
    
    .source-card {
        background: rgba(118, 185, 0, 0.05);
        border: 1px solid rgba(118, 185, 0, 0.2);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 5px 0;
        display: block;
        font-size: 0.82rem;
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
        color: #76b900 !important;
        font-family: 'Monaco', 'Consolas', monospace;
    }
    
    .source-card:hover {
        background: rgba(118, 185, 0, 0.15);
        border-color: #76b900;
        box-shadow: 0 0 10px rgba(118, 185, 0, 0.2);
        transform: translateX(5px);
    }
    
    /* Status Cards */
    .status-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        padding: 1.5rem;
        border: 1px solid rgba(118, 185, 0, 0.3);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    
    /* Animation for the Bot's Thought process */
    .thought-container {
        font-style: italic;
        color: #76b900;
        font-size: 0.9rem;
        margin-left: 1rem;
        border-left: 2px solid #76b900;
        padding-left: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# --- Storage Management (Cookies with Local Fallback) ---
if HAS_COOKIES:
    cookies = EncryptedCookieManager(
        password=os.getenv("COOKIE_PASSWORD", "ensia-export-secure-key-2026"),
    )
    if not cookies.ready():
        st.stop()
    if "prompt_history" not in cookies:
        cookies["prompt_history"] = json.dumps([])
        cookies.save()
    prompt_history = json.loads(cookies["prompt_history"])
else:
    # Local File Fallback
    HISTORY_FILE = "data/prompt_history.json"
    if not os.path.exists(HISTORY_FILE):
        os.makedirs("data", exist_ok=True)
        with open(HISTORY_FILE, "w") as f:
            json.dump([], f)
    
    with open(HISTORY_FILE, "r") as f:
        prompt_history = json.load(f)

# --- Chat History Persistence ---
CHAT_LOG_FILE = "data/chat_log.json"
if not os.path.exists(CHAT_LOG_FILE):
    with open(CHAT_LOG_FILE, "w") as f:
        json.dump([], f)

def save_chat_log(messages):
    with open(CHAT_LOG_FILE, "w") as f:
        json.dump(messages, f)

def load_chat_log():
    try:
        with open(CHAT_LOG_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_prompt_history(new_history):
    if HAS_COOKIES:
        cookies["prompt_history"] = json.dumps(new_history)
        cookies.save()
    else:
        with open("data/prompt_history.json", "w") as f:
            json.dump(new_history, f)

# --- Sidebar ---
with st.sidebar:
    st.image("https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-grn-500x200-d.png", width=200)
    st.markdown("### 🛡️ Compliance Control")
    st.info("Powered by NVIDIA NIM")
    
    st.divider()
    st.markdown("#### 📜 Recent Prompts")
    if prompt_history:
        for p in reversed(prompt_history[-5:]): # Show last 5
            if st.button(p[:30] + "...", key=f"hist_{hash(p)}", help=p):
                st.session_state["current_prompt"] = p
    else:
        st.caption("No history yet.")
    
    st.divider()
    st.markdown("####  Document Review")
    uploaded_file = st.file_uploader("Drop a license or product image", type=['pdf', 'png', 'jpg', 'jpeg', 'webp'])
    
    if uploaded_file:
        if uploaded_file.type.startswith('image/'):
            with st.spinner("the OCR is auditing the product image..."):
                audit_result = analyze_export_product(uploaded_file)
                st.session_state["image_audit"] = audit_result
                st.success(" Multimodal Audit Complete")
                with st.expander(" View Technical Audit"):
                    st.json(audit_result)
        else:
            st.success(f"PDF uploaded: {uploaded_file.name}")
    
    st.divider()
    if st.button(" Clear Chat History"):
        st.session_state.messages = []
        save_chat_log([])
        save_prompt_history([])
        st.rerun()

# --- Main Interface ---
st.markdown("<h1 class='main-header'Export  Engine</h1>", unsafe_allow_html=True)

# History Navigator (The "Arrow Up" Alternative)
if prompt_history:
    cols = st.columns([0.8, 0.2])
    with cols[1]:
        selected_past_prompt = st.selectbox(
            "📜 Quick History",
            options=["-- Select to Reload --"] + list(reversed(prompt_history)),
            label_visibility="collapsed"
        )
        if selected_past_prompt != "-- Select to Reload --":
            st.session_state["input_val"] = selected_past_prompt

# Initialize Agent in Session State
@st.cache_resource
def get_cached_agent():
    return initialize_ensia_agent()

if "agent" not in st.session_state:
    st.session_state.agent = get_cached_agent()

if "messages" not in st.session_state:
    # Load from persistent disk log
    st.session_state.messages = load_chat_log()

# Display Chat History
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        content = message["content"]
        if "### 🔗 Sources & References" in content:
            parts = content.split("### 🔗 Sources & References")
            st.markdown(parts[0], unsafe_allow_html=True)
            with st.expander("📚 View Verified Sources & References"):
                st.markdown(parts[1], unsafe_allow_html=True)
        else:
            st.markdown(content, unsafe_allow_html=True)

# Chat Input
input_val = st.session_state.get("input_val", "")
if prompt := st.chat_input("Ask a compliance question...", key="main_input"):
    # 1. Capture Multimodal Context (if any)
    image_context = ""
    if "image_audit" in st.session_state:
        image_context = f"### 🛠️ TECHNICAL PRODUCT AUDIT (CONTEXT):\n```json\n{json.dumps(st.session_state['image_audit'], indent=2)}\n```\n\n"
    
    # 2. Save prompt to history
    if prompt not in prompt_history:
        prompt_history.append(prompt)
        save_prompt_history(prompt_history[-20:])
    
    # 3. Clean UI state
    if "input_val" in st.session_state:
        del st.session_state["input_val"]
        
    # 4. Display clean prompt to user
    st.session_state.messages.append({"role": "user", "content": prompt})
    save_chat_log(st.session_state.messages)
    
    with st.chat_message("user"):
        st.markdown(prompt)

    # 5. Generate Agent Response (Simplified & Robust)
    with st.chat_message("assistant"):
        try:
            full_context_prompt = f"{image_context}User Query: {prompt}"
            
            # 1. Define a robust, filtered generator
            def stream_generator():
                for chunk, metadata in st.session_state.agent.stream(
                    {"messages": [("user", full_context_prompt)]}, 
                    stream_mode="messages"
                ):
                    # ONLY yield content if it's a final AIMessage (no tool calls)
                    if isinstance(chunk, AIMessage) and chunk.content:
                        # If the agent is sending tool calls, it's still "thinking"
                        if not chunk.tool_calls:
                            yield chunk.content

            # 2. Write the filtered stream directly to the chat
            full_raw_output = st.write_stream(stream_generator())
            
            final_stored_output = full_raw_output

        except Exception as e:
            final_stored_output = f"❌ Error: {str(e)}"
            st.error(final_stored_output)
        
        st.session_state.messages.append({"role": "assistant", "content": final_stored_output})
        save_chat_log(st.session_state.messages)

# --- Footer Metadata ---
st.divider()
col1, col2, col3 = st.columns(3)
with col1:
    st.caption("Vector Store: ChromaDB (data/vector_db)")
with col2:
    st.caption("Primary Model: Llama-3.1-Nemotron-70B")
with col3:
    st.caption("Last Sync: 2026-05-04")
