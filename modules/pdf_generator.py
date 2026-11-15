"""
Product-sheet PDF generator — reportlab Platypus.
Auto page-breaks; supports EN / FR / AR (RTL) / ES.
"""
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ── Colours ─────────────────────────────────────────────────────────────────────
C_NAVY   = colors.HexColor("#1A3C5E")
C_STEEL  = colors.HexColor("#2E86AB")
C_GOLD   = colors.HexColor("#E8A020")
C_ICE    = colors.HexColor("#EEF5FA")
C_FROST  = colors.HexColor("#F4F8FB")
C_BORDER = colors.HexColor("#BDD6E6")
C_DARK   = colors.HexColor("#222222")
C_MID    = colors.HexColor("#4A5568")
C_GREY   = colors.HexColor("#8A9BB0")
C_WHITE  = colors.white

# ── UI labels (all 4 languages) ─────────────────────────────────────────────────
_UI = {
    "en": {
        "title":               "PRODUCT SHEET",
        "subtitle":            "Export Catalog — IGAF AI Engine",
        "identification":      "IDENTIFICATION",
        "physical":            "PHYSICAL CHARACTERISTICS",
        "composition":         "COMPOSITION / MATERIALS",
        "commercial":          "COMMERCIAL INFORMATION",
        "supplier":            "SUPPLIER CONTACT",
        "features":            "KEY FEATURES",
        "description":         "PRODUCT DESCRIPTION",
        "usage":               "USAGE INSTRUCTIONS",
        "certifications":      "CERTIFICATIONS",
        "remarks":             "REMARKS",
        # field labels
        "name":                "Product Name",
        "brand":               "Brand",
        "reference":           "Reference / SKU",
        "product_type":        "Product Type",
        "country_of_origin":   "Country of Origin",
        "category":            "Category",
        "weight":              "Net Weight",
        "volume":              "Volume / Capacity",
        "dimensions":          "Dimensions",
        "format":              "Format",
        "color":               "Color",
        "materials":           "Materials / Ingredients",
        "certifications_lbl":  "Certifications",
        "usage_instructions":  "Usage Instructions",
        "colisage":            "Colisage / MOQ",
        "price":               "Price",
        "supplier_contact":    "Supplier Contact",
        "remarks_lbl":         "Remarks",
        # footer
        "page":                "Page 1",
        "footer":              "Generated for export",
    },
    "fr": {
        "title":               "FICHE PRODUIT",
        "subtitle":            "Catalogue Export — IGAF AI Engine",
        "identification":      "IDENTIFICATION",
        "physical":            "CARACTÉRISTIQUES PHYSIQUES",
        "composition":         "COMPOSITION / MATÉRIAUX",
        "commercial":          "INFORMATIONS COMMERCIALES",
        "supplier":            "COORDONNÉES FOURNISSEUR",
        "features":            "CARACTÉRISTIQUES CLÉS",
        "description":         "DESCRIPTION DU PRODUIT",
        "usage":               "CONSEILS D'UTILISATION",
        "certifications":      "CERTIFICATIONS",
        "remarks":             "REMARQUES",
        "name":                "Nom du produit",
        "brand":               "Marque",
        "reference":           "Référence / SKU",
        "product_type":        "Type de produit",
        "country_of_origin":   "Pays d'origine",
        "category":            "Catégorie",
        "weight":              "Poids net",
        "volume":              "Volume / Contenance",
        "dimensions":          "Dimensions",
        "format":              "Format",
        "color":               "Couleur",
        "materials":           "Matériaux / Ingrédients",
        "certifications_lbl":  "Certifications",
        "usage_instructions":  "Conseils d'utilisation",
        "colisage":            "Colisage / MOQ",
        "price":               "Prix",
        "supplier_contact":    "Coordonnées fournisseur",
        "remarks_lbl":         "Remarques",
        "page":                "Page 1",
        "footer":              "Généré pour l'export",
    },
    "ar": {
        "title":               "فيشة المنتج",
        "subtitle":            "IGAF AI Engine",
        "identification":      "بيانات التعريف",
        "physical":            "الخصائص الفيزيائية",
        "composition":         "التركيب / المواد",
        "commercial":          "المعلومات التجارية",
        "supplier":            "بيانات المورد",
        "features":            "المزايا الرئيسية",
        "description":         "وصف المنتج",
        "usage":               "تعليمات الاستخدام",
        "certifications":      "الشهادات والاعتمادات",
        "remarks":             "ملاحظات",
        "name":                "اسم المنتج",
        "brand":               "العلامة التجارية",
        "reference":           "المرجع / SKU",
        "product_type":        "نوع المنتج",
        "country_of_origin":   "بلد المنشأ",
        "category":            "الفئة",
        "weight":              "الوزن الصافي",
        "volume":              "الحجم / السعة",
        "dimensions":          "الأبعاد",
        "format":              "الشكل / التعبئة",
        "color":               "اللون",
        "materials":           "المواد / المكونات",
        "certifications_lbl":  "الشهادات",
        "usage_instructions":  "تعليمات الاستخدام",
        "colisage":            "التغليف / الحد الأدنى للطلب",
        "price":               "السعر",
        "supplier_contact":    "بيانات المورد",
        "remarks_lbl":         "ملاحظات",
        "page":                "Page 1",
        "footer":              "Generated for export",
    },
    "es": {
        "title":               "FICHA DE PRODUCTO",
        "subtitle":            "Catálogo de Exportación — ENSIA AI Engine",
        "identification":      "IDENTIFICACIÓN",
        "physical":            "CARACTERÍSTICAS FÍSICAS",
        "composition":         "COMPOSICIÓN / MATERIALES",
        "commercial":          "INFORMACIÓN COMERCIAL",
        "supplier":            "DATOS DEL PROVEEDOR",
        "features":            "CARACTERÍSTICAS CLAVE",
        "description":         "DESCRIPCIÓN DEL PRODUCTO",
        "usage":               "INSTRUCCIONES DE USO",
        "certifications":      "CERTIFICACIONES",
        "remarks":             "OBSERVACIONES",
        "name":                "Nombre del producto",
        "brand":               "Marca",
        "reference":           "Referencia / SKU",
        "product_type":        "Tipo de producto",
        "country_of_origin":   "País de origen",
        "category":            "Categoría",
        "weight":              "Peso neto",
        "volume":              "Volumen / Capacidad",
        "dimensions":          "Dimensiones",
        "format":              "Formato",
        "color":               "Color",
        "materials":           "Materiales / Ingredientes",
        "certifications_lbl":  "Certificaciones",
        "usage_instructions":  "Instrucciones de uso",
        "colisage":            "Embalaje / Pedido mínimo",
        "price":               "Precio",
        "supplier_contact":    "Datos del proveedor",
        "remarks_lbl":         "Observaciones",
        "page":                "Página 1",
        "footer":              "Generado para exportación",
    },
}

# ── Font registration ────────────────────────────────────────────────────────────
_REGISTERED: dict[str, str] = {}


def _register_font(lang: str) -> str:
    if lang in _REGISTERED:
        return _REGISTERED[lang]
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fonts_dir = os.path.join(root, "fonts")
    candidates = (
        [
            os.path.join(fonts_dir, "NotoSansArabic-Regular.ttf"),
            os.path.join(fonts_dir, "Amiri-Regular.ttf"),
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/tahoma.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        if lang == "ar"
        else [
            os.path.join(fonts_dir, "DejaVuSans.ttf"),
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
    )
    for path in candidates:
        if path and os.path.exists(path):
            try:
                name = f"PSF_{lang}"
                pdfmetrics.registerFont(TTFont(name, path))
                _REGISTERED[lang] = name
                return name
            except Exception:
                pass
    _REGISTERED[lang] = "Helvetica"
    return "Helvetica"


# ── Arabic reshaping ─────────────────────────────────────────────────────────────
def _ar(text: str, lang: str) -> str:
    if lang != "ar" or not text:
        return str(text)
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(str(text)))
    except ImportError:
        return str(text)


# ── Style factory ────────────────────────────────────────────────────────────────
def _styles(font: str, is_rtl: bool) -> dict:
    al = TA_RIGHT if is_rtl else TA_LEFT

    def ps(name, size, bold=False, color=C_DARK, align=None, lm=1.4):
        fn = "Helvetica-Bold" if bold and font == "Helvetica" else font
        style = ParagraphStyle(
            name, fontName=fn, fontSize=size, leading=size * lm,
            textColor=color, alignment=align if align is not None else al,
        )
        if is_rtl:
            style.wordWrap = 'RTL'
        return style

    return {
        "title":       ps("t",   13, bold=True,  color=C_WHITE, align=TA_CENTER),
        "sub":         ps("s",    7, bold=False, color=colors.HexColor("#A8C8E0"), align=TA_CENTER),
        "prod_name":   ps("pn",  13, bold=True,  color=C_NAVY),
        "sec_title":   ps("st",   8, bold=True,  color=C_NAVY),
        "lbl":         ps("lb",   8, bold=True,  color=C_NAVY),
        "val":         ps("vl",   9, bold=False, color=C_DARK, lm=1.45),
        "feat":        ps("ft",   9, bold=False, color=C_DARK, lm=1.45),
        "desc":        ps("db",  9.5, bold=False, color=C_DARK, lm=1.65),
    }


# ── Canvas callback: header + footer ────────────────────────────────────────────
def _on_page(ui: dict, font: str, lang: str, margin: float):
    def cb(c, doc):
        pw, ph = A4
        banner_h = 2.0 * cm

        # header
        c.saveState()
        c.setFillColor(C_NAVY)
        c.rect(0, ph - banner_h, pw, banner_h, fill=1, stroke=0)
        c.setFillColor(C_GOLD)
        c.rect(0, ph - banner_h, pw, 3, fill=1, stroke=0)

        c.setFont(font, 13)
        c.setFillColor(C_WHITE)
        title = _ar(ui["title"], lang)
        tw = c.stringWidth(title, font, 13)
        c.drawString((pw - tw) / 2, ph - 1.32 * cm, title)

        c.setFont("Helvetica", 6.5)
        c.setFillColor(colors.HexColor("#A8C8E0"))
        sub = ui["subtitle"]
        sw = c.stringWidth(sub, "Helvetica", 6.5)
        c.drawString((pw - sw) / 2, ph - 1.74 * cm, sub)
        c.restoreState()

        # footer
        c.saveState()
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(0.5)
        c.line(margin, 1.3 * cm, pw - margin, 1.3 * cm)
        c.setFont("Helvetica", 7)
        c.setFillColor(C_GREY)
        c.drawString(margin, 0.75 * cm, ui["page"])
        fw = c.stringWidth(ui["footer"], "Helvetica", 7)
        c.drawString(pw - margin - fw, 0.75 * cm, ui["footer"])
        c.restoreState()

    return cb


# ── Section header ───────────────────────────────────────────────────────────────
def _section(label: str, st: dict, is_rtl: bool, cw: float) -> list:
    """Return [gold HRFlowable, section title Paragraph, thin blue HR, Spacer]."""
    return [
        HRFlowable(width="100%", thickness=2, color=C_GOLD,
                   spaceBefore=0.35 * cm, spaceAfter=0.1 * cm),
        Paragraph(label, st["sec_title"]),
        HRFlowable(width="100%", thickness=0.5, color=C_BORDER,
                   spaceBefore=0.05 * cm, spaceAfter=0.15 * cm),
    ]


# ── Field-value row builder ──────────────────────────────────────────────────────
def _field_rows(pairs: list[tuple[str, str]], st: dict, is_rtl: bool, cw: float) -> Table | None:
    """Build a borderless 2-column label-value Table from (label, value) pairs."""
    rows = []
    for label, value in pairs:
        if not value:
            continue
        lp = Paragraph(label, st["lbl"])
        vp = Paragraph(_ar(str(value), is_rtl and "ar" or ""), st["val"]) if is_rtl else Paragraph(str(value), st["val"])
        # For RTL: value LEFT, label RIGHT
        rows.append([vp, lp] if is_rtl else [lp, vp])

    if not rows:
        return None

    lbl_w = cw * 0.32
    val_w = cw * 0.68
    col_w = [val_w, lbl_w] if is_rtl else [lbl_w, val_w]

    tbl = Table(rows, colWidths=col_w)
    n = len(rows)
    tbl.setStyle(TableStyle([
        *[("BACKGROUND", (0, i), (-1, i),
           C_ICE if i % 2 == 0 else C_WHITE) for i in range(n)],
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",         (0, 0), (-1, -1), "RIGHT" if is_rtl else "LEFT"),
        ("BOX",           (0, 0), (-1, -1), 0.5, C_BORDER),
        ("LINEBELOW",     (0, 0), (-1, -2), 0.3, C_BORDER),
    ]))
    return tbl


# ── Image helper ─────────────────────────────────────────────────────────────────
def _make_image(image_path: str, max_w: float, max_h: float):
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        reader = ImageReader(image_path)
        iw, ih = reader.getSize()
        scale = min(max_w / iw, max_h / ih)
        return RLImage(image_path, width=iw * scale, height=ih * scale)
    except Exception:
        return None


# ── Public entry point ───────────────────────────────────────────────────────────
def generate_pdf(product_data: dict, image_path: str, output_path: str, lang: str) -> str:
    """Build a product-sheet PDF and save to output_path. Returns output_path."""
    ui     = _UI.get(lang, _UI["en"])
    font   = _register_font(lang)
    is_rtl = lang == "ar"
    st     = _styles(font, is_rtl)

    pw, ph  = A4
    margin  = 1.8 * cm
    cw      = pw - 2 * margin

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        topMargin=2.4 * cm, bottomMargin=1.8 * cm,
        leftMargin=margin, rightMargin=margin,
    )

    def t(key: str) -> str:
        return _ar(ui.get(key, key), lang)

    def v(key: str) -> str:
        return _ar(str(product_data.get(key, "") or ""), lang)

    def has(key: str) -> bool:
        val = product_data.get(key)
        return bool(val) if not isinstance(val, list) else bool([x for x in val if x])

    story: list = []

    # ── Product name ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(v("name"), st["prod_name"]))
    story.append(HRFlowable(width="100%", thickness=2.5, color=C_STEEL,
                             spaceBefore=0.1 * cm, spaceAfter=0.4 * cm))

    # ── Top layout: image RIGHT + identification fields LEFT ──────────────────────
    img_w  = 5.0 * cm
    gap    = 0.5 * cm
    info_w = cw - img_w - gap

    img_fl = _make_image(image_path, img_w - 4, img_w - 4)
    img_cell = img_fl if img_fl else Spacer(img_w, img_w * 0.5)

    id_pairs = [
        (t("brand"),          product_data.get("brand", "")),
        (t("reference"),      product_data.get("reference", "")),
        (t("product_type"),   product_data.get("product_type", "")),
        (t("category"),       product_data.get("category", "")),
        (t("country_of_origin"), product_data.get("country_of_origin", "")),
    ]
    id_rows = []
    for label, value in id_pairs:
        if not value:
            continue
        lp = Paragraph(label, st["lbl"])
        vp = Paragraph(_ar(str(value), lang), st["val"])
        id_rows.append([vp, lp] if is_rtl else [lp, vp])

    if id_rows:
        lbl_w = info_w * 0.40
        val_w = info_w * 0.60
        id_tbl = Table(id_rows, colWidths=[val_w, lbl_w] if is_rtl else [lbl_w, val_w])
        id_tbl.setStyle(TableStyle([
            *[("BACKGROUND", (0, i), (-1, i),
               C_ICE if i % 2 == 0 else C_WHITE) for i in range(len(id_rows))],
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN",         (0, 0), (-1, -1), "RIGHT" if is_rtl else "LEFT"),
            ("BOX",           (0, 0), (-1, -1), 0.5, C_BORDER),
            ("LINEBELOW",     (0, 0), (-1, -2), 0.3, C_BORDER),
        ]))
        info_cell = id_tbl
    else:
        info_cell = Spacer(info_w, 0.5 * cm)

    if is_rtl:
        top_data   = [[img_cell, info_cell]]
        top_widths = [img_w, info_w + gap]
    else:
        top_data   = [[info_cell, img_cell]]
        top_widths = [info_w + gap, img_w]

    top_tbl = Table(top_data, colWidths=top_widths)
    top_tbl.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("ALIGN",         (0, 0), (0, 0),  "RIGHT" if is_rtl else "LEFT"),
        ("ALIGN",         (1, 0), (1, 0),  "LEFT"  if is_rtl else "RIGHT"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(top_tbl)

    # ── Physical characteristics ──────────────────────────────────────────────────
    phys_pairs = [
        (t("weight"),     product_data.get("weight", "")),
        (t("volume"),     product_data.get("volume", "")),
        (t("dimensions"), product_data.get("dimensions", "")),
        (t("format"),     product_data.get("format", "")),
        (t("color"),      product_data.get("color", "")),
    ]
    phys_tbl = _field_rows(phys_pairs, st, is_rtl, cw)
    if phys_tbl:
        story.extend(_section(t("physical"), st, is_rtl, cw))
        story.append(phys_tbl)

    # ── Composition ───────────────────────────────────────────────────────────────
    if has("materials"):
        story.extend(_section(t("composition"), st, is_rtl, cw))
        story.append(Paragraph(_ar(str(product_data.get("materials", "")), lang), st["val"]))

    # ── Certifications ────────────────────────────────────────────────────────────
    if has("certifications"):
        story.extend(_section(t("certifications"), st, is_rtl, cw))
        story.append(Paragraph(v("certifications"), st["val"]))

    # ── Key features ──────────────────────────────────────────────────────────────
    features = [f for f in (product_data.get("features") or []) if f]
    if features:
        story.extend(_section(t("features"), st, is_rtl, cw))
        for feat in features:
            story.append(Paragraph(_ar("• " + str(feat), lang), st["feat"]))
            story.append(Spacer(1, 1 * mm))

    # ── Product description ───────────────────────────────────────────────────────
    if has("description"):
        story.extend(_section(t("description"), st, is_rtl, cw))
        if is_rtl:
            import re
            raw = str(product_data.get("description", "") or "")
            # Split into sentences and reshape each independently — running
            # get_display() on the whole paragraph at once breaks bidi ordering
            # when ReportLab later wraps the text across multiple lines.
            parts = [s.strip() for s in re.split(r'(?<=[.!?؟])\s+', raw) if s.strip()]
            if not parts:
                parts = [raw]
            joined = '<br/>'.join(_ar(p, lang) for p in parts)
            story.append(Paragraph(joined, st["desc"]))
        else:
            story.append(Paragraph(v("description"), st["desc"]))

    # ── Usage instructions ────────────────────────────────────────────────────────
    if has("usage_instructions"):
        story.extend(_section(t("usage"), st, is_rtl, cw))
        story.append(Paragraph(v("usage_instructions"), st["val"]))

    # ── Commercial info ───────────────────────────────────────────────────────────
    comm_pairs = [
        (t("colisage"), product_data.get("colisage", "")),
        (t("price"),    product_data.get("price", "")),
    ]
    comm_tbl = _field_rows(comm_pairs, st, is_rtl, cw)
    if comm_tbl:
        story.extend(_section(t("commercial"), st, is_rtl, cw))
        story.append(comm_tbl)

    # ── Supplier contact ──────────────────────────────────────────────────────────
    if has("supplier_contact"):
        story.extend(_section(t("supplier"), st, is_rtl, cw))
        story.append(Paragraph(v("supplier_contact"), st["val"]))

    # ── Remarks ───────────────────────────────────────────────────────────────────
    if has("remarks"):
        story.extend(_section(t("remarks"), st, is_rtl, cw))
        story.append(Paragraph(v("remarks"), st["val"]))

    # ── Build ─────────────────────────────────────────────────────────────────────
    cb = _on_page(ui, font, lang, margin)
    doc.build(story, onFirstPage=cb, onLaterPages=cb)
    return output_path
