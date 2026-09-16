from django.urls import path
from . import views

urlpatterns = [
    path('', views.CartView.as_view(), name='cart'),
    path('add/', views.AddToCartView.as_view(), name='add-to-cart'),
    path('items/<int:pk>/', views.CartItemUpdateView.as_view(), name='cart-item-update'),
    path('items/<int:pk>/delete/', views.CartItemDeleteView.as_view(), name='cart-item-delete'),
    path('clear/', views.ClearCartView.as_view(), name='clear-cart'),
]