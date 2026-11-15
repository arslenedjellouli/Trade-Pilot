"""
Product Sheet Generator
  Tab 1 — AI-Powered  : image → OCR → augment → translate → edit → PDF
  Tab 2 — Manual Entry: fill fields manually → PDF
"""
import json
import os
import re
import tempfile

import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="Product Sheet Generator",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
    .stApp {
        background: radial-gradient(circle at 10% 20%, rgb(15,15,15) 0%, rgb(30,30,30) 90.2%);
        color: #e0e0e0;
    }
    section[data-testid="stSidebar"] {
        background-color: rgba(20,20,20,0.8) !important;
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(26,60,94,0.5);
    }
    .field-label {
        color: #2E86AB; font-weight: 600; font-size: 0.78rem;
        text-transform: uppercase; letter-spacing: 0.05em;
    }
    .field-value { color: #f0f0f0; font-size: 0.92rem; }
</style>
""", unsafe_allow_html=True)

# ── Imports ───────────────────────────────────────────────────────────────────
from tools.gemini_ocr import analyze_export_product
from modules.augment import augment_product_data
from modules.translator import translate_product_data
from modules.pdf_generator import generate_pdf

_rag_available = False
try:
    from tools.rag import query_compliance_documents as _rag_query
    _rag_available = True
except Exception:
    pass

# ── OCR noise helpers (AI tab) ────────────────────────────────────────────────
_RE_BOLD        = re.compile(r'\*\*[^*]*\*\*')
_RE_PLACEHOLDER = re.compile(r'\([^)]{0,40}\)')
_RE_DATE_NOISE  = re.compile(r'(?:تاريخ|صلاحية|إنتاج|استيراد)[^\d\n]*:\s*\d{4}|\b20\d{2}\b')
_RE_CONTACT     = re.compile(r'\S+@\S+|\b\d{7,}\b')


def _strip_noise(text: str) -> str:
    if not text:
        return ""
    text = _RE_BOLD.sub(" ", text)
    text = _RE_PLACEHOLDER.sub(" ", text)
    text = _RE_DATE_NOISE.sub(" ", text)
    text = _RE_CONTACT.sub(" ", text)
    text = re.sub(r'[-–—]{2,}', ' ', text)
    return re.sub(r'\s+', ' ', text).strip(' -–—،,.')


def _format_ocr(ocr_result: dict) -> str:
    if "error" in ocr_result:
        return f"OCR error: {ocr_result['error']}"
    lines: list[str] = []

    def add(label, raw):
        if not raw:
            return
        val = _strip_noise(str(raw))
        if val and len(val) > 2 and val.lower() not in ("-", "n/a", "none", "null"):
            lines.append(f"{label}: {val}")

    basic = ocr_result.get("basic_info", {})
    add("Brand",             basic.get("brand"))
    add("Product name",      basic.get("product_name"))
    add("Net weight",        basic.get("net_weight"))
    add("Country of origin", basic.get("country_of_origin"))
    add("Category",          basic.get("category"))

    vision = ocr_result.get("vision_engine_322", {})
    attrs  = vision.get("physical_attributes", {})
    add("Color",             attrs.get("color"))
    add("Shape / packaging", attrs.get("shape"))
    add("Material",          attrs.get("material"))

    visual_raw = str(vision.get("visual_conformity", "") or "")
    if not _RE_BOLD.search(visual_raw) and not _RE_PLACEHOLDER.search(visual_raw):
        clean = _strip_noise(visual_raw)
        if len(clean) > 20:
            add("Packaging description", clean)

    compliance = ocr_result.get("compliance_engine_323", {})
    certs = [str(c) for c in (compliance.get("certifications") or []) if c]
    if certs:
        add("Certifications", ", ".join(certs))

    if not lines:
        for k, v in ocr_result.items():
            if isinstance(v, str):
                add(k.replace("_", " ").title(), v)

    return "\n".join(lines) if lines else "Product image provided."


def _get_rag_context(product_name: str, category: str) -> str:
    if not _rag_available:
        return ""
    try:
        result = _rag_query.run(
            f"export compliance requirements for {product_name} {category}".strip()
        )
        return result if isinstance(result, str) else ""
    except Exception:
        return ""


def _image_key(f) -> str:
    return f"{f.name}_{f.size}"


def _save_temp(uploaded_file) -> str:
    suffix = os.path.splitext(uploaded_file.name)[-1].lower() or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(uploaded_file.getvalue())
    tmp.close()
    return tmp.name


def _out_dir() -> str:
    d = os.path.join("data", "product_sheets")
    os.makedirs(d, exist_ok=True)
    return d


# ── Session state ─────────────────────────────────────────────────────────────
for _k in (
    "ps_image_key", "ps_image_path", "ps_ocr_output",
    "ps_augmented_data", "ps_translated_data", "ps_edited_data",
    "ps_pdf_path", "ps_last_lang",
    "ps_manual_image_path", "ps_manual_pdf_path",
):
    if _k not in st.session_state:
        st.session_state[_k] = None


# ── Sidebar: language only ────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 📄 Product Sheet Generator")
    st.divider()
    lang_map = {
        "English":           "en",
        "French (Français)": "fr",
        "Arabic (العربية)":  "ar",
        "Spanish (Español)": "es",
    }
    selected_lang_label = st.selectbox("Output language", list(lang_map.keys()))
    target_lang = lang_map[selected_lang_label]


# ── Shared form builder (used in both tabs) ───────────────────────────────────
def _product_form(form_key: str, defaults: dict, submit_label: str, image_optional: bool = False):
    """
    Render a full product-data form inside st.form(form_key).
    Returns (submitted: bool, data: dict, image_path: str | None).
    """
    image_path = None
    with st.form(form_key):
        if image_optional:
            st.markdown("#### Product Image *(optional)*")
            img_upload = st.file_uploader(
                "Upload an image to embed in the PDF",
                type=["jpg", "jpeg", "png"],
                key=f"{form_key}_img",
            )
            if img_upload:
                image_path = _save_temp(img_upload)
                st.image(img_upload, width=200)

        st.markdown("#### Identification")
        ca, cb = st.columns(2)
        with ca:
            f_name    = st.text_input("Product Name",      value=defaults.get("name", ""))
            f_brand   = st.text_input("Brand",             value=defaults.get("brand", ""))
            f_ref     = st.text_input("Reference / SKU",   value=defaults.get("reference", ""))
        with cb:
            f_type    = st.text_input("Product Type",      value=defaults.get("product_type", ""))
            f_cat     = st.text_input("Category",          value=defaults.get("category", ""))
            f_country = st.text_input("Country of Origin", value=defaults.get("country_of_origin", ""))

        st.markdown("#### Physical Characteristics")
        cc, cd = st.columns(2)
        with cc:
            f_weight  = st.text_input("Net Weight",        value=defaults.get("weight", ""))
            f_volume  = st.text_input("Volume / Capacity", value=defaults.get("volume", ""))
            f_dims    = st.text_input("Dimensions",        value=defaults.get("dimensions", ""))
        with cd:
            f_format  = st.text_input("Format",            value=defaults.get("format", ""))
            f_color   = st.text_input("Color",             value=defaults.get("color", ""))

        st.markdown("#### Composition / Materials")
        f_mats = st.text_area("Materials / Ingredients",
                              value=defaults.get("materials", ""), height=80)

        st.markdown("#### Certifications")
        f_certs = st.text_input("Certifications", value=defaults.get("certifications", ""))

        st.markdown("#### Key Features *(one per line)*")
        feats_default = "\n".join(defaults.get("features", []) or [])
        f_feats = st.text_area("Features", value=feats_default, height=120,
                               label_visibility="collapsed")

        st.markdown("#### Product Description")
        f_desc = st.text_area("Description", value=defaults.get("description", ""),
                              height=130, label_visibility="collapsed")

        st.markdown("#### Usage Instructions")
        f_usage = st.text_area("Usage Instructions",
                               value=defaults.get("usage_instructions", ""), height=80)

        st.markdown("#### Commercial Information")
        ce, cf = st.columns(2)
        with ce:
            f_colisage = st.text_input("Colisage / MOQ", value=defaults.get("colisage", ""))
        with cf:
            f_price    = st.text_input("Price",          value=defaults.get("price", ""))

        st.markdown("#### Supplier Contact")
        f_supplier = st.text_area("Supplier Contact",
                                  value=defaults.get("supplier_contact", ""), height=80)

        st.markdown("#### Remarks")
        f_remarks = st.text_area("Remarks", value=defaults.get("remarks", ""), height=80)

        submitted = st.form_submit_button(submit_label, type="primary", use_container_width=True)

    data = {
        "name":               f_name,
        "brand":              f_brand,
        "reference":          f_ref,
        "product_type":       f_type,
        "category":           f_cat,
        "country_of_origin":  f_country,
        "weight":             f_weight,
        "volume":             f_volume,
        "dimensions":         f_dims,
        "format":             f_format,
        "color":              f_color,
        "materials":          f_mats,
        "certifications":     f_certs,
        "features":           [x.strip() for x in f_feats.splitlines() if x.strip()],
        "description":        f_desc,
        "usage_instructions": f_usage,
        "colisage":           f_colisage,
        "price":              f_price,
        "supplier_contact":   f_supplier,
        "remarks":            f_remarks,
    }
    return submitted, data, image_path


# ── Page title ────────────────────────────────────────────────────────────────
st.markdown("# 📄 Product Sheet Generator")

tab1, tab2 = st.tabs(["🤖 AI-Powered", "✏️ Manual Entry"])


# ════════════════════════════════════════════════════════════════════════════════
# TAB 1 — AI-POWERED
# ════════════════════════════════════════════════════════════════════════════════
with tab1:
    st.markdown(
        "Upload a product image. OCR + AI will extract and enrich the data, "
        "translate it, then generate a downloadable PDF."
    )

    uploaded_file = st.file_uploader(
        "Drop a product image here",
        type=["jpg", "jpeg", "png"],
        key="_ps_uploader",
    )

    if uploaded_file is not None:
        new_key = _image_key(uploaded_file)
        if st.session_state.ps_image_key != new_key:
            st.session_state.ps_image_key       = new_key
            st.session_state.ps_image_path      = None
            st.session_state.ps_ocr_output      = None
            st.session_state.ps_augmented_data  = None
            st.session_state.ps_translated_data = None
            st.session_state.ps_edited_data     = None
            st.session_state.ps_pdf_path        = None
            st.session_state.ps_last_lang       = None

        if st.session_state.ps_image_path is None:
            st.session_state.ps_image_path = _save_temp(uploaded_file)

        st.image(uploaded_file, caption=uploaded_file.name,
                 use_container_width=False, width=360)

        generate_clicked = st.button(
            "⚙️ Generate Product Sheet",
            type="primary",
            use_container_width=False,
        )

        # ── Pipeline ──────────────────────────────────────────────────────────
        if generate_clicked:
            need_ocr   = st.session_state.ps_ocr_output is None
            need_aug   = st.session_state.ps_augmented_data is None
            need_trans = (
                st.session_state.ps_translated_data is None
                or st.session_state.ps_last_lang != target_lang
            )
            need_pdf = need_trans or st.session_state.ps_pdf_path is None

            with st.status("Running pipeline...", expanded=True) as status_box:

                if need_ocr:
                    st.write("🔍 Running OCR...")
                    print("[pipeline] Step 1 — OCR ...", flush=True)
                    try:
                        ocr_result = analyze_export_product(uploaded_file)
                        st.session_state.ps_ocr_output = _format_ocr(ocr_result)
                        st.session_state.ps_ocr_raw    = ocr_result
                        print("[pipeline] Step 1 — OCR complete.", flush=True)
                        st.write("✅ OCR complete.")
                    except Exception as e:
                        status_box.update(label="Pipeline failed", state="error")
                        st.error(f"OCR failed: {e}")
                        st.stop()
                else:
                    st.write("⏭️ OCR — cached.")

                rag_context = ""
                if need_aug:
                    st.write("📚 Retrieving RAG context...")
                    try:
                        ocr_raw = st.session_state.get("ps_ocr_raw") or {}
                        basic   = ocr_raw.get("basic_info", {})
                        rag_context = _get_rag_context(
                            basic.get("product_name", ""),
                            basic.get("category", ""),
                        )
                        st.write("✅ RAG context retrieved." if rag_context
                                 else "⏭️ RAG — no context, continuing.")
                    except Exception:
                        st.write("⏭️ RAG — skipped.")

                if need_aug:
                    st.write("🤖 Augmenting with AI...")
                    print("[pipeline] Step 3 — augmentation ...", flush=True)
                    try:
                        aug = augment_product_data(
                            raw_ocr_text=st.session_state.ps_ocr_output or "",
                            rag_context=rag_context,
                        )
                        st.session_state.ps_augmented_data = aug
                        print("[pipeline] Step 3 — augmentation complete.", flush=True)
                        st.write("✅ Augmentation complete.")
                    except Exception as e:
                        status_box.update(label="Pipeline failed", state="error")
                        st.error(f"Augmentation failed: {e}")
                        st.stop()
                else:
                    st.write("⏭️ Augmentation — cached.")

                if need_trans:
                    if target_lang == "en":
                        st.write("⏭️ Translation — English, skipping.")
                        st.session_state.ps_translated_data = st.session_state.ps_augmented_data
                    else:
                        st.write(f"🌐 Translating to {selected_lang_label}...")
                        print(f"[pipeline] Step 4 — translation to {selected_lang_label} ...", flush=True)
                        try:
                            translated = translate_product_data(
                                st.session_state.ps_augmented_data, target_lang
                            )
                            st.session_state.ps_translated_data = translated
                            st.session_state.ps_edited_data     = None
                            st.session_state.ps_last_lang       = target_lang
                            print("[pipeline] Step 4 — translation complete.", flush=True)
                            st.write("✅ Translation complete.")
                        except Exception as e:
                            status_box.update(label="Pipeline failed", state="error")
                            st.error(f"Translation failed: {e}")
                            st.stop()
                else:
                    st.write("⏭️ Translation — cached.")

                if need_pdf:
                    st.write("📄 Generating PDF...")
                    print("[pipeline] Step 5 — generating PDF ...", flush=True)
                    try:
                        safe = (
                            (st.session_state.ps_translated_data or {})
                            .get("name", "product").replace(" ", "_")[:40]
                        )
                        out_path = os.path.join(_out_dir(), f"{safe}_{target_lang}.pdf")
                        generate_pdf(
                            product_data=st.session_state.ps_translated_data or {},
                            image_path=st.session_state.ps_image_path or "",
                            output_path=out_path,
                            lang=target_lang,
                        )
                        st.session_state.ps_pdf_path = out_path
                        print(f"[pipeline] Step 5 — PDF saved to {out_path}", flush=True)
                        st.write("✅ PDF generated.")
                    except Exception as e:
                        status_box.update(label="Pipeline failed", state="error")
                        st.error(f"PDF generation failed: {e}")
                        st.stop()
                else:
                    st.write("⏭️ PDF — cached.")

                status_box.update(label="Pipeline complete!", state="complete", expanded=False)

        # ── Edit form (shown once data exists) ────────────────────────────────
        if st.session_state.ps_augmented_data:
            st.divider()
            st.markdown("### 🗂️ Edit Product Data")
            st.caption("All fields are pre-filled by AI. Edit anything, then click **Apply & Regenerate PDF**.")

            base = (
                st.session_state.ps_edited_data
                or st.session_state.ps_translated_data
                or st.session_state.ps_augmented_data
            )

            submitted, edited, _ = _product_form(
                form_key="ps_edit_form",
                defaults=base,
                submit_label="✅ Apply & Regenerate PDF",
                image_optional=False,
            )

            if submitted:
                st.session_state.ps_edited_data = edited
                try:
                    safe = edited.get("name", "product").replace(" ", "_")[:40]
                    out_path = os.path.join(_out_dir(), f"{safe}_{target_lang}.pdf")
                    print("[pipeline] Regenerating PDF with edits ...", flush=True)
                    generate_pdf(
                        product_data=edited,
                        image_path=st.session_state.ps_image_path or "",
                        output_path=out_path,
                        lang=target_lang,
                    )
                    st.session_state.ps_pdf_path = out_path
                    print(f"[pipeline] PDF saved to {out_path}", flush=True)
                    st.success("PDF regenerated with your edits!")
                    st.rerun()
                except Exception as e:
                    st.error(f"PDF generation failed: {e}")

            with st.expander("📋 Raw JSON"):
                st.json(base)

        # ── Download ──────────────────────────────────────────────────────────
        if st.session_state.ps_pdf_path and os.path.exists(st.session_state.ps_pdf_path):
            st.divider()
            with open(st.session_state.ps_pdf_path, "rb") as f:
                pdf_bytes = f.read()
            st.download_button(
                label="⬇️ Download Product Sheet PDF",
                data=pdf_bytes,
                file_name=os.path.basename(st.session_state.ps_pdf_path),
                mime="application/pdf",
                use_container_width=True,
                type="primary",
            )

    else:
        st.info("Upload a product image above to start the AI pipeline.")


# ════════════════════════════════════════════════════════════════════════════════
# TAB 2 — MANUAL ENTRY
# ════════════════════════════════════════════════════════════════════════════════
with tab2:
    st.markdown(
        "Fill in the product information manually. "
        "You can optionally upload an image to embed in the PDF."
    )

    submitted, manual_data, manual_img = _product_form(
        form_key="ps_manual_form",
        defaults={},
        submit_label="📄 Generate Product Sheet PDF",
        image_optional=True,
    )

    if submitted:
        if not manual_data.get("name"):
            st.warning("Please enter at least a product name before generating.")
        else:
            try:
                img_path = manual_img or st.session_state.ps_manual_image_path or ""
                safe = manual_data["name"].replace(" ", "_")[:40]
                out_path = os.path.join(_out_dir(), f"{safe}_{target_lang}_manual.pdf")
                print(f"[manual] Generating PDF for '{manual_data['name']}' ...", flush=True)
                generate_pdf(
                    product_data=manual_data,
                    image_path=img_path,
                    output_path=out_path,
                    lang=target_lang,
                )
                st.session_state.ps_manual_pdf_path  = out_path
                if manual_img:
                    st.session_state.ps_manual_image_path = manual_img
                print(f"[manual] PDF saved to {out_path}", flush=True)
                st.success("PDF generated!")
                st.rerun()
            except Exception as e:
                st.error(f"PDF generation failed: {e}")

    if st.session_state.ps_manual_pdf_path and os.path.exists(st.session_state.ps_manual_pdf_path):
        st.divider()
        with open(st.session_state.ps_manual_pdf_path, "rb") as f:
            pdf_bytes = f.read()
        st.download_button(
            label="⬇️ Download Product Sheet PDF",
            data=pdf_bytes,
            file_name=os.path.basename(st.session_state.ps_manual_pdf_path),
            mime="application/pdf",
            use_container_width=True,
            type="primary",
        )
