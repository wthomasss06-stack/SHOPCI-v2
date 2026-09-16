# ecommerce_backend/orders/serializers.py

from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(read_only=True)
    product_image = serializers.ImageField(read_only=True)

    class Meta:
        model  = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'quantity', 'price', 'subtotal'
        ]
        read_only_fields = ['id', 'price', 'subtotal', 'product_name', 'product_image']


class OrderSerializer(serializers.ModelSerializer):
    items          = OrderItemSerializer(many=True, read_only=True)
    buyer_name     = serializers.CharField(source='buyer.username', read_only=True)
    buyer_phone    = serializers.CharField(source='buyer.phone', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items_count    = serializers.IntegerField(read_only=True)
    # Alias frontend
    total = serializers.DecimalField(
        source='total_amount', max_digits=15, decimal_places=2, read_only=True
    )

    # ── GPS & LIVRAISON TEMPS RÉEL ────────────────────────────────────────
    vendor_location   = serializers.SerializerMethodField()
    package_photo_url = serializers.SerializerMethodField()
    # ─────────────────────────────────────────────────────────────────────

    class Meta:
        model  = Order
        fields = [
            'id', 'buyer', 'buyer_name', 'buyer_phone',
            'status', 'status_display',
            'total_amount', 'total',
            'delivery_address', 'phone',
            'items', 'items_count',
            # GPS & livraison
            'vendor_location',
            'vendor_location_updated',
            'estimated_minutes',
            'package_photo',
            'package_photo_url',
            'delivery_confirmed_by_vendor',
            'delivery_rating',
            # dates
            'created_at', 'updated_at', 'delivered_at',
        ]
        read_only_fields = [
            'id', 'buyer', 'total_amount', 'total',
            'created_at', 'updated_at',
        ]

    def get_vendor_location(self, obj):
        return obj.vendor_location  # utilise la @property du modèle

    def get_package_photo_url(self, obj):
        request = self.context.get('request')
        if obj.package_photo:
            try:
                return request.build_absolute_uri(obj.package_photo.url) if request else obj.package_photo.url
            except Exception:
                return None
        return None


class OrderCreateSerializer(serializers.Serializer):
    """Créer une commande depuis le panier — cash uniquement"""
    delivery_address = serializers.CharField()
    phone            = serializers.CharField()
    payment_method   = serializers.CharField(default='cash')

    def validate_delivery_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("L'adresse de livraison est requise")
        return value.strip()

    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le numéro de téléphone est requis")
        return value.strip()

    def validate_payment_method(self, value):
        # Seul le cash est autorisé — paiements mobiles en travaux
        return 'cash'