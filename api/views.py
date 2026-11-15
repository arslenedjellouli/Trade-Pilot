"""
Django API views for ENSIA Export AI Engine.
All endpoints are CSRF-exempt JSON APIs consumed by the React frontend.
"""
import json
import os
import re
import secrets
import shutil
import sys
import tempfile
import threading
import uuid
from pathlib import Path

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .models import Product

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


# ── Lazy AI module loaders ────────────────────────────────────────────────────

def _ocr():
    from tools.gemini_ocr import analyze_export_product
    return analyze_export_product


def _augment():
    from modules.augment import augment_product_data
    return augment_product_data


def _translate():
    from modules.translator import translate_product_data
    return translate_product_data


def _pdf():
    from modules.pdf_generator import generate_pdf
    return generate_pdf


def _rag():
    try:
        from tools.rag import query_compliance_documents
        return query_compliance_documents
    except Exception:
        return None


# ── OCR output helpers ────────────────────────────────────────────────────────

_RE_BOLD        = re.compile(r'\*\*[^*]*\*\*')
_RE_PLACEHOLDER = re.compile(r'\([^)]{0,40}\)')
_RE_DATE_NOISE  = re.compile(r'(?:تاريخ|صلاحية|إنتاج|استيراد)[^\d\n]*:\s*\d{4}|\b20\d{2}\b')
_RE_CONTACT     = re.compile(r'\S+@\S+|\b\d{7,}\b')


def _strip_noise(text):
    if not text:
        return ''
    text = _RE_BOLD.sub(' ', text)
    text = _RE_PLACEHOLDER.sub(' ', text)
    text = _RE_DATE_NOISE.sub(' ', text)
    text = _RE_CONTACT.sub(' ', text)
    text = re.sub(r'[-–—]{2,}', ' ', text)
    return re.sub(r'\s+', ' ', text).strip(' -–—،,.')


def _format_ocr(ocr_result):
    if 'error' in ocr_result:
        return f"OCR error: {ocr_result['error']}"
    lines = []

    def add(label, raw):
        if not raw:
            return
        val = _strip_noise(str(raw))
        if val and len(val) > 2 and val.lower() not in ('-', 'n/a', 'none', 'null'):
            lines.append(f'{label}: {val}')

    basic = ocr_result.get('basic_info', {})
    add('Brand',             basic.get('brand'))
    add('Product name',      basic.get('product_name'))
    add('Net weight',        basic.get('net_weight'))
    add('Country of origin', basic.get('country_of_origin'))
    add('Category',          basic.get('category'))

    vision = ocr_result.get('vision_engine_322', {})
    attrs  = vision.get('physical_attributes', {})
    add('Color',             attrs.get('color'))
    add('Shape / packaging', attrs.get('shape'))
    add('Material',          attrs.get('material'))

    visual_raw = str(vision.get('visual_conformity', '') or '')
    if not _RE_BOLD.search(visual_raw) and not _RE_PLACEHOLDER.search(visual_raw):
        clean = _strip_noise(visual_raw)
        if len(clean) > 20:
            add('Packaging description', clean)

    compliance = ocr_result.get('compliance_engine_323', {})
    certs = [str(c) for c in (compliance.get('certifications') or []) if c]
    if certs:
        add('Certifications', ', '.join(certs))

    if not lines:
        for k, v in ocr_result.items():
            if isinstance(v, str):
                add(k.replace('_', ' ').title(), v)

    return '\n'.join(lines) if lines else 'Product image provided.'


def _rag_context(product_name, category):
    rag_fn = _rag()
    if not rag_fn:
        return ''
    try:
        return rag_fn(f'{product_name} {category} export compliance Algeria'.strip())
    except Exception:
        return ''


# ── Helper ────────────────────────────────────────────────────────────────────

def _json_body(request):
    try:
        return json.loads(request.body)
    except Exception:
        return {}


def _err(msg, status=400):
    return JsonResponse({'error': msg}, status=status)


def _auth_token(email):
    return TimestampSigner(key=settings.SECRET_KEY).sign(email)


def _authenticated(request):
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return False
    try:
        email = TimestampSigner(key=settings.SECRET_KEY).unsign(
            header[7:],
            max_age=int(os.getenv('AUTH_TOKEN_MAX_AGE', '3600')),
        )
    except (BadSignature, SignatureExpired, ValueError):
        return False
    return bool(email)


def api_auth_required(view_func):
    def wrapped(view, request, *args, **kwargs):
        if not _authenticated(request):
            return _err('Authentication required', 401)
        return view_func(view, request, *args, **kwargs)
    return wrapped


# ── Auth ──────────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        data = _json_body(request)
        email = str(data.get('email', '')).strip().lower()
        password = str(data.get('password', ''))
        configured_email = os.getenv('AUTH_EMAIL', '').strip().lower()
        configured_password = os.getenv('AUTH_PASSWORD', '')
        if (
            not configured_email
            or not configured_password
            or not secrets.compare_digest(email, configured_email)
            or not secrets.compare_digest(password, configured_password)
        ):
            return _err('Invalid credentials', 401)
        return JsonResponse({
            'token': _auth_token(email),
            'user':  {'email': email, 'name': email.split('@')[0]},
        })


# ── Products ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class ProductListView(View):
    def get(self, request):
        products = Product.objects.all()
        return JsonResponse([p.to_dict() for p in products], safe=False)

    def post(self, request):
        data       = _json_body(request)
        pid        = f'prod-{uuid.uuid4().hex[:8]}'
        pd         = data.get('productData', {})
        product    = Product.objects.create(
            product_id   = pid,
            name         = data.get('name', pd.get('name', '')),
            product_data = pd,
            image_path   = data.get('imagePath', ''),
            lang         = data.get('lang', 'en'),
            markets      = data.get('markets', []),
            compliance   = data.get('compliance', {}),
            history      = data.get('history', []),
        )
        return JsonResponse(product.to_dict(), status=201)


@method_decorator(csrf_exempt, name='dispatch')
class ProductDetailView(View):
    def _get_or_404(self, pid):
        try:
            return Product.objects.get(product_id=pid)
        except Product.DoesNotExist:
            return None

    def get(self, request, pid):
        product = self._get_or_404(pid)
        if not product:
            return _err('Product not found', 404)
        return JsonResponse(product.to_dict())

    def put(self, request, pid):
        product = self._get_or_404(pid)
        if not product:
            return _err('Product not found', 404)
        data = _json_body(request)
        if 'productData' in data:
            product.product_data = data['productData']
            product.name         = data['productData'].get('name', product.name)
        if 'markets'    in data: product.markets    = data['markets']
        if 'compliance' in data: product.compliance = data['compliance']
        if 'history'    in data: product.history    = data['history']
        if 'lang'       in data: product.lang       = data['lang']
        if 'imagePath'  in data: product.image_path = data['imagePath']
        product.save()
        return JsonResponse(product.to_dict())

    def delete(self, request, pid):
        product = self._get_or_404(pid)
        if not product:
            return _err('Product not found', 404)
        product.delete()
        return JsonResponse({'deleted': True})


# ── AI: full OCR pipeline ─────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class AIPipelineView(View):
    def post(self, request):
        if 'image' not in request.FILES:
            return _err('No image file provided')

        lang   = request.POST.get('lang', 'en')
        img    = request.FILES['image']
        suffix = Path(img.name or 'image.jpg').suffix or '.jpg'

        upload_dir = settings.MEDIA_ROOT / 'ocr_uploads'
        upload_dir.mkdir(parents=True, exist_ok=True)
        image_path = str(upload_dir / f'{uuid.uuid4().hex}{suffix}')

        with open(image_path, 'wb') as f:
            for chunk in img.chunks():
                f.write(chunk)

        try:
            print('[pipeline] OCR ...', flush=True)
            ocr_result   = _ocr()(image_path)
            raw_text     = _format_ocr(ocr_result)

            name_hint     = (ocr_result.get('basic_info') or {}).get('product_name', '')
            category_hint = (ocr_result.get('basic_info') or {}).get('category', '')
            rag_ctx       = _rag_context(name_hint, category_hint)

            print('[pipeline] Augmenting ...', flush=True)
            product_data = _augment()(raw_text, rag_ctx)

            if lang != 'en':
                print(f'[pipeline] Translating -> {lang} ...', flush=True)
                product_data = _translate()(product_data, lang)

            print('[pipeline] Done.', flush=True)
            return JsonResponse({
                'productData': product_data,
                'imagePath':   image_path,
                'rawOcr':      raw_text,
            })
        except Exception as exc:
            return _err(str(exc), 500)


# ── AI: PDF generation ────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class AIGeneratePDFView(View):
    def post(self, request):
        data         = _json_body(request)
        product_data = data.get('productData', {})
        image_path   = data.get('imagePath') or None
        lang         = data.get('lang', 'en')

        tmp_dir = tempfile.mkdtemp(prefix='ensia_pdf_')
        try:
            output_path = os.path.join(tmp_dir, 'product_sheet.pdf')
            _pdf()(product_data, image_path, output_path, lang)
            with open(output_path, 'rb') as f:
                pdf_bytes = f.read()
        except Exception as exc:
            return _err(str(exc), 500)
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

        name     = product_data.get('name', 'product_sheet')
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{name}.pdf"'
        return response


# ── AI: text-only generation ──────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class AIGenerateProductView(View):
    def post(self, request):
        data = _json_body(request)
        name = data.get('name', '')
        raw  = (
            f"Product name: {name}\n"
            f"Description: {data.get('description', '')}\n"
            f"Material: {data.get('material', '')}\n"
            f"Certifications: {', '.join(data.get('certifications', []))}"
        )
        try:
            pd = _augment()(raw)
            return JsonResponse({
                'description':  pd.get('description', ''),
                'sellingPoints': pd.get('features', []),
                'benefits':     [pd.get('category', ''), pd.get('country_of_origin', ''), pd.get('format', '')],
                'compliance':   {
                    'score': 80, 'warnings': [],
                    'certifications': [c.strip() for c in pd.get('certifications', '').split(',') if c.strip()],
                    'riskClaims': [],
                },
                'productData': pd,
            })
        except Exception as exc:
            return _err(str(exc), 500)


# ── AI: translate ─────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class AITranslateView(View):
    def post(self, request):
        data = _json_body(request)
        try:
            translated = _translate()(data.get('productData', {}), data.get('lang', 'en'))
            return JsonResponse({'productData': translated})
        except Exception as exc:
            return _err(str(exc), 500)


# ── AI: improve suggestions ───────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class AIImproveView(View):
    def post(self, request):
        data = _json_body(request)
        product = Product.objects.filter(product_id=data.get('productId', '')).first()
        if not product:
            return _err('Product not found', 404)
        product_data = product.product_data or {}
        category = product_data.get('category') or 'the target market'
        return JsonResponse({
            'suggestions': [
                f'Refine the product story to target {category} buyers with compliance-first language.',
                'Add verified certifications prominently to the opening description for trust signals.',
                'Emphasize packaging durability and logistics readiness for export contexts.',
                'Highlight the country-of-origin as a quality differentiator in target markets.',
                'Add specific Middle East or African market messaging to broaden appeal.',
            ]
        })


# ── Chat: OCR-only audit ──────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class ChatOCRView(View):
    """Run NVIDIA vision OCR on an uploaded image and return the raw audit JSON."""

    def post(self, request):
        if 'image' not in request.FILES:
            return _err('No image provided')

        img        = request.FILES['image']
        suffix     = Path(img.name or 'image.jpg').suffix or '.jpg'
        upload_dir = settings.MEDIA_ROOT / 'ocr_uploads'
        upload_dir.mkdir(parents=True, exist_ok=True)
        image_path = str(upload_dir / f'{uuid.uuid4().hex}{suffix}')

        with open(image_path, 'wb') as f:
            for chunk in img.chunks():
                f.write(chunk)

        try:
            result = _ocr()(image_path)
            return JsonResponse({'result': result, 'imagePath': image_path})
        except Exception as exc:
            return _err(str(exc), 500)


# ── Chat: streaming agent response (SSE) ─────────────────────────────────────

_agent_instance = None
_agent_lock = threading.Lock()


def _get_agent():
    global _agent_instance
    if _agent_instance is None:
        with _agent_lock:
            if _agent_instance is None:
                from core.agent import initialize_ensia_agent
                _agent_instance = initialize_ensia_agent()
    return _agent_instance


def _stream_agent(agent, prompt):
    from langchain_core.messages import AIMessage
    try:
        result = agent.invoke({'messages': [('user', prompt)]})
        messages = result.get('messages', [])
        final_msg = next(
            (m for m in reversed(messages)
             if isinstance(m, AIMessage)
             and m.content
             and not getattr(m, 'tool_calls', None)),
            None,
        )
        if final_msg:
            content = final_msg.content if isinstance(final_msg.content, str) else str(final_msg.content)
            yield f"data: {json.dumps({'content': content})}\n\n"
        else:
            yield f"data: {json.dumps({'error': 'No response generated'})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"
    yield 'data: [DONE]\n\n'


@method_decorator(csrf_exempt, name='dispatch')
class ChatMessageView(View):
    def post(self, request):
        data          = _json_body(request)
        message       = data.get('message', '').strip()
        image_context = data.get('imageContext', '').strip()

        if not message:
            return _err('No message provided')

        if image_context:
            full_prompt = (
                f"### TECHNICAL PRODUCT AUDIT (CONTEXT):\n"
                f"```json\n{image_context}\n```\n\n"
                f"User Query: {message}"
            )
        else:
            full_prompt = message

        try:
            agent = _get_agent()
        except Exception as exc:
            return _err(f'Agent unavailable: {exc}', 503)

        response = StreamingHttpResponse(
            _stream_agent(agent, full_prompt),
            content_type='text/event-stream',
        )
        response['X-Accel-Buffering'] = 'no'
        response['Cache-Control']     = 'no-cache'
        return response


for _view in (
    ProductListView,
    ProductDetailView,
    AIPipelineView,
    AIGeneratePDFView,
    AIGenerateProductView,
    AITranslateView,
    AIImproveView,
    ChatOCRView,
    ChatMessageView,
):
    _view.dispatch = method_decorator(csrf_exempt)(
        api_auth_required(_view.dispatch)
    )
