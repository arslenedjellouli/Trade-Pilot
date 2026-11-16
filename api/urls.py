from django.urls import path
from . import views

urlpatterns = [
    # Products
    path('products/',               views.ProductListView.as_view(),     name='product-list'),
    path('products/<str:pid>/',     views.ProductDetailView.as_view(),   name='product-detail'),

    # AI
    path('ai/pipeline/',            views.AIPipelineView.as_view(),      name='ai-pipeline'),
    path('ai/generate-pdf/',        views.AIGeneratePDFView.as_view(),   name='ai-pdf'),
    path('ai/generate-product/',    views.AIGenerateProductView.as_view(),name='ai-generate'),
    path('ai/translate/',           views.AITranslateView.as_view(),     name='ai-translate'),
    path('ai/improve/',             views.AIImproveView.as_view(),       name='ai-improve'),

    # Chat
    path('chat/ocr/',               views.ChatOCRView.as_view(),         name='chat-ocr'),
    path('chat/message/',           views.ChatMessageView.as_view(),     name='chat-message'),
]
