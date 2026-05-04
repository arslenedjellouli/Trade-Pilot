import re
import os
import glob
import base64
import fitz  # PyMuPDF for high-speed PDF-to-image conversion
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings, ChatNVIDIA
from langchain_core.messages import HumanMessage
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
RAW_DATA_DIR = "data/raw_pdfs"
VECTOR_DB_DIR = "data/vector_db"
CHUNK_SIZE = 2048
CHUNK_OVERLAP = 200
EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2"
# VL model for OCR/Multimodal extraction verified in your NIM catalog
VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl" 

def extract_links(text: str) -> list:
    """Identifies URLs in the text."""
    url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
    links = re.findall(url_pattern, text)
    return list(set(link.strip('.,') for link in links))

def get_multimodal_extraction(page_image_bytes):
    """Uses NVIDIA NIM Vision model to extract text/details from an image."""
    img_b64 = base64.b64encode(page_image_bytes).decode('utf-8')
    
    vl_llm = ChatNVIDIA(model=VISION_MODEL)
    
    prompt = "Extract all text from this document page. If there are diagrams or tables, describe them in detail for compliance review."
    
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
        ]
    )
    
    try:
        response = vl_llm.invoke([message])
        return response.content
    except Exception as e:
        print(f"⚠️ Multimodal extraction failed: {e}")
        return ""

def run_ingestion():
    """
    Ingests PDFs with Multimodal OCR fallback for scanned pages.
    """
    print(f"🚀 Starting Multimodal Ingestion Pipeline...")
    
    # 1. Initialize NVIDIA Services
    embeddings = NVIDIAEmbeddings(model=EMBEDDING_MODEL, truncate="NONE")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    
    all_chunks = []
    pdf_files = glob.glob(os.path.join(RAW_DATA_DIR, "*.pdf"))
    
    if not pdf_files:
        print(f"⚠️ No PDF files found in {RAW_DATA_DIR}")
        return

    for pdf_path in pdf_files:
        print(f"📄 Processing: {os.path.basename(pdf_path)}...")
        try:
            # Open with PyMuPDF for visual analysis
            doc = fitz.open(pdf_path)
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                
                # Check if the page is likely a scanned image (little to no extractable text)
                if len(text.strip()) < 150:
                    print(f"  👁️ Page {page_num+1}: Low text detected. Running Multimodal OCR...")
                    # Convert page to image (300 DPI)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img_bytes = pix.tobytes("png")
                    
                    # Extract via NVIDIA VL Model
                    enriched_text = get_multimodal_extraction(img_bytes)
                    text = f"[Multimodal Extraction Page {page_num+1}]\n{enriched_text}"
                
                # Create a temporary document object for chunking
                from langchain_core.documents import Document
                doc_obj = Document(
                    page_content=text,
                    metadata={"source": os.path.basename(pdf_path), "page": page_num + 1}
                )
                
                # Split page into chunks
                chunks = text_splitter.split_documents([doc_obj])
                
                # Metadata Enrichment
                for chunk in chunks:
                    links = extract_links(chunk.page_content)
                    chunk.metadata["has_links"] = bool(links)
                    chunk.metadata["link_references"] = ", ".join(links) if links else ""
                    chunk.metadata["source_file"] = os.path.basename(pdf_path)
                
                all_chunks.extend(chunks)
            
            doc.close()
        except Exception as e:
            print(f"❌ Error processing {pdf_path}: {e}")

    # 3. Persistent Storage in ChromaDB
    if all_chunks:
        print(f"📦 Storing {len(all_chunks)} chunks in {VECTOR_DB_DIR}...")
        vector_db = Chroma.from_documents(
            documents=all_chunks,
            embedding=embeddings,
            persist_directory=VECTOR_DB_DIR
        )
        print(f"✅ Ingestion Complete. Vector store saved at {VECTOR_DB_DIR}")
    else:
        print("❌ No chunks were generated. Ingestion aborted.")

if __name__ == "__main__":
    run_ingestion()
