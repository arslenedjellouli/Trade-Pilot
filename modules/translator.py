import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

_LANG_PROMPTS = {
    "en": (
        "Translate all string values to formal English suitable for professional B2B export catalogs. "
        "The input values may be in any language — translate every value to English."
    ),
    "fr": (
        "Translate all string values to formal French suitable for professional B2B export catalogs. "
        "Use standard business French (not informal)."
    ),
    "ar": (
        "Translate all string values to Modern Standard Arabic (الفصحى / MSA). "
        "This text is for professional commercial export documents — use formal register only. "
        "Do NOT use any dialect (Darija, Egyptian, Levantine, etc.)."
    ),
    "es": (
        "Translate all string values to formal Spanish suitable for professional B2B export catalogs. "
        "Use standard business Spanish."
    ),
}

_TRANSLATE_PROMPT = """You are a professional B2B export catalog translator.

{lang_instruction}

Given this product data JSON, translate ONLY the values to the target language.
- Keep ALL JSON keys exactly as they are in English.
- Translate every string value.
- For the "features" key (a list of strings), translate each string in the list.
- Return ONLY the translated JSON object. No markdown fences, no explanation.

Input JSON:
{input_json}
"""


def _strip_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def translate_product_data(product_data: dict, target_lang: str) -> dict:
    """
    Translate all string values (and feature list items) in product_data to
    target_lang using Mistral AI mistral-small-latest.

    target_lang values: "en" | "fr" | "ar" | "es"
    If target_lang is "en", returns the dict unchanged (no API call).
    """
    lang_instruction = _LANG_PROMPTS.get(
        target_lang,
        f"Translate all string values to {target_lang} using professional language.",
    )
    prompt = _TRANSLATE_PROMPT.format(
        lang_instruction=lang_instruction,
        input_json=json.dumps(product_data, ensure_ascii=False, indent=2),
    )

    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY is not set in environment")

    print(f"[translate] Calling Mistral mistral-small-latest (-> {target_lang}) ...", flush=True)

    # Try standard import first, then fall back to mistralai.client submodule
    try:
        from mistralai import Mistral
    except ImportError:
        from mistralai.client import Mistral

    client = Mistral(api_key=api_key)
    response = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    raw = response.choices[0].message.content

    print("[translate] Mistral — OK", flush=True)
    return json.loads(_strip_json(raw))
