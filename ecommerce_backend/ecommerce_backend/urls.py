# ecommerce_backend/ecommerce_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

# Configuration personnalisée de l'admin
admin.site.site_header = "ShopCI Administration"
admin.site.site_title = "ShopCI Admin"
admin.site.index_title = "Bienvenue sur le panneau d'administration"

urlpatterns = [
    # ==================================================
    # ADMIN
    # ==================================================
    path('admin/', admin.site.urls),
    
    # ==================================================
    # API ENDPOINTS
    # ==================================================
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    
    # ==================================================
    # JWT TOKEN MANAGEMENT
    # ==================================================
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

# ==================================================
# SERVIR LES FICHIERS MEDIA ET STATIC EN DÉVELOPPEMENT
# ==================================================
if settings.DEBUG:
    # Fichiers média (uploads)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Fichiers statiques
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Documentation de l'API (optionnel - nécessite coreapi)
    # Décommentez après avoir installé coreapi: pip install coreapi
    # try:
    #     from rest_framework.documentation import include_docs_urls
    #     urlpatterns += [
    #         path('api/docs/', include_docs_urls(title='ShopCI API')),
    #     ]
    # except ImportError:
    #     pass