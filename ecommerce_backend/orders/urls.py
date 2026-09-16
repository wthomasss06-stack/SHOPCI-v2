# ecommerce_backend/orders/urls.py

from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    VendorOrdersView,
    VendorLocationUpdateView,
    PackagePhotoView,
    VendorConfirmArrivalView,
    BuyerConfirmDeliveryView,
)

urlpatterns = [
    # ── Existants ──────────────────────────────────────────────────────────
    path('',          OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(),     name='order-detail'),
    path('vendor/',   VendorOrdersView.as_view(),    name='vendor-orders'),

    # ── GPS & Livraison temps réel ─────────────────────────────────────────
    path('<int:pk>/location/',               VendorLocationUpdateView.as_view(), name='order-location'),
    path('<int:pk>/package-photo/',          PackagePhotoView.as_view(),         name='order-package-photo'),
    path('<int:pk>/vendor-confirm-arrival/', VendorConfirmArrivalView.as_view(), name='vendor-confirm-arrival'),
    path('<int:pk>/buyer-confirm-delivery/', BuyerConfirmDeliveryView.as_view(), name='buyer-confirm-delivery'),
]