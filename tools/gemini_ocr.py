import re
import json
import base64
import PIL.Image
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

def repair_json_string(s: str) -> str:
    """Attempts to fix common LLM JSON errors like missing commas."""
    # 1. Fix missing commas between objects/lines
    s = re.sub(r'}\s*"{', '}, "{', s)
    s = re.sub(r'"\s*"\s*:', '", "', s)
    # 2. Fix trailing commas before closing braces
    s = re.sub(r',\s*([\]}])', r'\1', s)
    return s

# Load environment variables
load_dotenv()

def analyze_export_product(image_path_or_bytes):
    """
    Perform an Algerian Export Compliance Audit using NVIDIA Multimodal Vision.
    (Unified with NVIDIA NIM Stack)
    """
    try:
        # 1. Initialize NVIDIA VL Model
        # Using the specialized Vision-Language model from your catalog
        vl_llm = ChatNVIDIA(model="nvidia/nemotron-nano-12b-v2-vl")

        # 2. Process Image to Base64
        if isinstance(image_path_or_bytes, str):
            with open(image_path_or_bytes, "rb") as f:
                img_bytes = f.read()
        else:
            # Handle Streamlit UploadedFile (BytesIO)
            img_bytes = image_path_or_bytes.getvalue()
        
        img_b64 = base64.b64encode(img_bytes).decode('utf-8')

        # 3. Spec-Aligned Prompt Logic (v3.0)
        prompt = """
        Perform a Deep Algerian Export Compliance & Vision Audit.
        Analyze the image and return ONLY a JSON object with the following structure:

        {
          "basic_info": {
            "brand": "",
            "product_name": "",
            "net_weight": "",
            "country_of_origin": "",
            "category": "Agro-alimentaire"
          },
          "vision_engine_322": {
            "image_quality_score": "1-10",
            "physical_attributes": {
              "color": "",
              "material": "",
              "shape": ""
            },
            "visual_conformity": "Detailed description of product appearance"
          },
          "compliance_engine_323": {
            "esg_claims": ["Verified environmental claims found on packaging"],
            "certifications": ["e.g., ISO, Organic, Halal, EAC"],
            "greenwashing_alerts": ["Flag any suspicious or unverifiable eco-claims"],
            "compliance_status": "COMPLIANT | NON-COMPLIANT (if origin not Algeria)"
          }
        }

        Return ONLY the raw JSON. No conversational filler.
        """

        # 4. Execute Multimodal Request
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            ]
        )
        
        response = vl_llm.invoke([message])

        # 5. Robust JSON Extraction (Handles extra text after JSON block)
        raw_text = response.content.strip()
        
        # Find the first { and the last }
        match = re.search(r'(\{.*\})', raw_text, re.DOTALL)
        if match:
            json_str = match.group(1)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                # Attempt self-healing
                repaired = repair_json_string(json_str)
                return json.loads(repaired)
        else:
            # Fallback if no JSON block found
            return json.loads(raw_text.replace('```json', '').replace('```', '').strip())

    except Exception as e:
        return {"error": f"NVIDIA Vision Audit Failed: {str(e)}"}

if __name__ == "__main__":
    # Test execution
    TEST_FILE = "download.jpg"
    if os.path.exists(TEST_FILE):
        print(f"--- Auditing {TEST_FILE} via NVIDIA VL ---")
        result = analyze_export_product(TEST_FILE)
        print(json.dumps(result, indent=2, ensure_ascii=False))
