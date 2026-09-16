# ecommerce_backend/products/urls.py
# VERSION COMPLÈTE avec routes Favoris

from django.urls import path
from . import views

urlpatterns = [
    # Products
    path('', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('vendor/', views.VendorProductsView.as_view(), name='vendor-products'),
    
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    
    # ✅ NOUVEAU: Favoris
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/toggle/', views.FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('favorites/check/', views.FavoriteCheckView.as_view(), name='favorite-check'),
]