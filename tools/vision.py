import base64
import os
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage
from langchain.tools import tool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
# Using Llama 3.2 Vision which is optimized for both OCR and visual reasoning
VISION_MODEL = "nvidia/llama-3.2-11b-vision-instruct"

def encode_image(image_path):
    """Encodes an image to base64."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

@tool
def analyze_compliance_document_image(image_path: str, prompt: str = "Extract all text and explain the compliance implications of this document.") -> str:
    """
    Analyzes an image of a compliance document, license, or technical diagram.
    Provide the full file path and a specific question or prompt.
    """
    print(f"👁️ Analyzing Image: {os.path.basename(image_path)}...")
    
    try:
        if not os.path.exists(image_path):
            return f"Error: The file at {image_path} does not exist."

        # 1. Prepare the image
        image_b64 = encode_image(image_path)
        
        # 2. Initialize NVIDIA Vision NIM
        vision_llm = ChatNVIDIA(model=VISION_MODEL)
        
        # 3. Construct the Multimodal Message
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/png;base64,{image_b64}"}
                },
            ]
        )
        
        # 4. Invoke and return response
        response = vision_llm.invoke([message])
        return response.content

    except Exception as e:
        return f"Vision processing failed: {str(e)}"

if __name__ == "__main__":
    # Test block (requires a sample image)
    print("🚀 Vision Tool Loaded. Ready for integration.")
