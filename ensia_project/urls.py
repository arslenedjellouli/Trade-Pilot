from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse
from pathlib import Path
import os


def serve_react(request, *args, **kwargs):
    """Serve the React SPA index.html for all non-API routes."""
    index = Path(settings.BASE_DIR) / 'frontend' / 'dist' / 'index.html'
    if index.exists():
        return FileResponse(open(index, 'rb'), content_type='text/html')
    from django.http import HttpResponse
    return HttpResponse(
        '<h2>Run <code>cd frontend && npm run build</code> first, '
        'or use <code>npm run dev</code> for the Vite dev server.</h2>',
        status=200,
    )


urlpatterns = [
    path('api/', include('api.urls')),
    re_path(r'^(?!api/).*$', serve_react),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
