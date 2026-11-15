import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

_AUGMENT_PROMPT = """You are a senior B2B export catalog specialist. Your job is to analyse raw OCR/vision data
extracted from a product image and produce a complete, export-ready product data sheet.

IMPORTANT — OCR NOISE: The raw data may contain field-template placeholders such as
"* النوع :", "* الشكل :", "* اللون :", or similar structural labels from the product label itself.
These are NOT product values — ignore them completely and extract only actual product information.

{rag_block}

=== RAW OCR / VISION DATA ===
{raw_ocr_text}
=== END DATA ===

Analyse the data above and return ONLY a valid JSON object with exactly these keys:

{{
  "name":               "Complete product name including variety/type",
  "brand":              "Brand name exactly as it appears on the packaging",
  "reference":          "SKU, barcode, or reference code if visible, else empty string",
  "product_type":       "Type or variety of product (e.g. 'Dried dates', 'Instant coffee', 'Sparkling water')",
  "country_of_origin":  "Country where the product was produced or packaged",
  "weight":             "Net weight with unit (e.g. '1 kg / 35.27 oz'). Include metric and imperial if both visible.",
  "volume":             "Volume or capacity with unit (e.g. '500 ml', '1.5 L') or empty string if not applicable",
  "dimensions":         "Physical dimensions of the packaging (e.g. '20 x 12 x 8 cm')",
  "format":             "Format or presentation form (e.g. 'Bag', 'Can', 'Bottle 500ml', 'Cardboard box')",
  "color":              "Color or visual appearance of the product or its packaging",
  "materials":          "Packaging materials and product composition/ingredients (e.g. 'Cardboard box; 100% natural Deglet Nour dates, no additives')",
  "category":           "Precise product category (e.g. 'Agro-Food / Dried Fruits & Nuts')",
  "certifications":     "Visible certifications or quality marks (e.g. 'Halal certified, ISO 22000') or empty string",
  "usage_instructions": "Usage, preparation, or consumption instructions if visible on packaging, else empty string",
  "colisage":           "Packaging/colisage info: units per carton, units per pallet, minimum order quantity if visible, else empty string",
  "price":              "Price information if visible on packaging, else empty string",
  "supplier_contact":   "Supplier or manufacturer name, address, phone, email if clearly printed on packaging, else empty string",
  "remarks":            "Any additional notes, storage conditions, or special mentions visible on the packaging",
  "features": [
    "Feature 1 — specific quality or origin claim",
    "Feature 2 — packaging or preservation detail",
    "Feature 3 — nutritional or health property",
    "Feature 4 — export or compliance advantage",
    "Feature 5 — target market or use case"
  ],
  "description": "Four to five sentences of professional B2B export catalog copy. Sentence 1: introduce the product and its premium origin. Sentence 2: describe taste profile, quality grade, or key characteristics. Sentence 3: packaging and shelf-life for export logistics. Sentence 4: target markets and buyer benefits. Sentence 5: compliance or certification angle."
}}

STRICT RULES:
- Return ONLY the JSON object. Absolutely no markdown fences, no explanation, no preamble.
- Never invent data — if a field is genuinely unknown, use an empty string "" or empty list [].
- The description MUST be 4–5 sentences, professional, specific, and B2B-grade.
- The features list MUST have exactly 5 entries (or fewer only if truly not enough information exists).
- Do NOT echo raw input lines verbatim. Extract facts — do not copy template noise.
- Do NOT include expiry dates or import dates as product features or in the description.
- supplier_contact should ONLY be filled if a company name / address / phone is clearly on the packaging.
"""


def _extract_json(text: str) -> str:
    """Strip markdown fences, then extract the outermost {...} block."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    # Find the first '{' and last '}' to handle any surrounding commentary
    start = text.find("{")
    end   = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def augment_product_data(raw_ocr_text: str, rag_context: str = "") -> dict:
    """
    Extract detailed structured product fields from raw OCR text.
    Tries Gemini models in order, then falls back to Groq llama-3.1-8b-instant.
    """
    rag_block = (
        f"=== COMPLIANCE KNOWLEDGE BASE CONTEXT ===\n{rag_context}\n=== END CONTEXT ==="
        if rag_context
        else ""
    )
    prompt = _AUGMENT_PROMPT.format(
        raw_ocr_text=raw_ocr_text,
        rag_block=rag_block,
    )

    # --- Primary: Google Gemini (tries models in order) ---
    gemini_error = None
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in environment")

        import google.generativeai as genai

        genai.configure(api_key=api_key)

        for model_name in ("gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"):
            try:
                print(f"[augment] Calling {model_name} ...", flush=True)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                result = json.loads(_extract_json(response.text))
                print(f"[augment] {model_name} — OK", flush=True)
                return result
            except Exception as e:
                print(f"[augment] {model_name} failed: {e}", flush=True)

        raise ValueError("No Gemini model responded successfully")

    except Exception as exc:
        gemini_error = exc

    # --- Fallback: Groq llama-3.1-8b-instant ---
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment")

        from groq import Groq
        client = Groq(api_key=api_key)

        for groq_model in ("llama-3.3-70b-versatile", "llama3-70b-8192", "llama-3.1-8b-instant"):
            try:
                print(f"[augment] Falling back to Groq {groq_model} ...", flush=True)
                response = client.chat.completions.create(
                    model=groq_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=3000,
                )
                result = json.loads(_extract_json(response.choices[0].message.content))
                print(f"[augment] Groq {groq_model} — OK", flush=True)
                return result
            except Exception as e:
                print(f"[augment] Groq {groq_model} failed: {e}", flush=True)

        raise ValueError("No Groq model responded successfully")

    except Exception as groq_error:
        print(f"[augment] Groq failed: {groq_error}", flush=True)
        raise RuntimeError(
            f"Both LLM providers failed during augmentation.\n"
            f"Gemini error: {gemini_error}\n"
            f"Groq error:   {groq_error}"
        )
