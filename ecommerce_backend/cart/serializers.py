# ecommerce_backend/cart/serializers.py
# VERSION FINALE CORRIGÉE - Compatible avec les modèles

from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer
from decimal import Decimal


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer pour les items du panier"""
    product = ProductSerializer(read_only=True)
    # ✅ CORRECTION: Ne pas redéfinir subtotal, utiliser celui du modèle
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'subtotal']
        read_only_fields = ['id', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    """Serializer pour le panier"""
    items = CartItemSerializer(many=True, read_only=True)
    # ✅ CORRECTION: Ne pas redéfinir total et items_count, utiliser ceux du modèle
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total', 'items_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'total', 'items_count', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    """Serializer pour ajouter un produit au panier"""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)