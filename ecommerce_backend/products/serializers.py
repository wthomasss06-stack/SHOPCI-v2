# ecommerce_backend/products/serializers.py
# VERSION COMPLÈTE avec FavoriteSerializer

from rest_framework import serializers
from .models import Product, Category, ProductImage, Favorite
import json


# ------------------------------
# CATEGORY SERIALIZER
# ------------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description']


# ------------------------------
# PRODUCT IMAGE SERIALIZER
# ------------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']


# ------------------------------
# PRODUCT READ SERIALIZER
# ------------------------------
class ProductSerializer(serializers.ModelSerializer):
    """Serializer utilisé pour afficher les produits."""
    # ⚠️ vendor_email / vendor_phone retirés : ce serializer est public
    # (endpoint catalogue accessible sans authentification). Exposer l'email
    # et le téléphone du vendeur ici les rendait scrapables par n'importe qui
    # et permettait de contourner la plateforme pour le contacter en direct.
    # Le contact vendeur doit passer par une messagerie interne ou être
    # révélé uniquement après commande.
    vendor_name = serializers.CharField(source='vendor.username', read_only=True)
    vendor_profile_photo = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'stock',
            'image', 'images', 'category', 'category_name',
            'vendor', 'vendor_name',
            'vendor_profile_photo', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'vendor', 'created_at', 'updated_at']

    def get_vendor_profile_photo(self, obj):
        """Retourne l'URL complète de la photo de profil du vendeur"""
        if obj.vendor and hasattr(obj.vendor, 'profile_photo') and obj.vendor.profile_photo:
            request = self.context.get('request')
            try:
                if request:
                    return request.build_absolute_uri(obj.vendor.profile_photo.url)
                return obj.vendor.profile_photo.url
            except:
                return None
        return None


# ------------------------------
# PRODUCT CREATE/UPDATE SERIALIZER
# ------------------------------
class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer utilisé pour CRÉER ou MODIFIER un produit."""
    
    additional_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'stock',
            'image', 'category', 'additional_images'
        ]

    def validate_price(self, value):
       if value <= 0:
            raise serializers.ValidationError("Le prix doit être supérieur à 0.")
       if value > 50_000_000_000:
            raise serializers.ValidationError("Le prix ne peut pas dépasser 50 000 000 000 FCFA.")
       return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Le stock ne peut pas être négatif.")
        return value

    def create(self, validated_data):
        additional_images = validated_data.pop('additional_images', [])
        product = Product.objects.create(**validated_data)

        for img in additional_images:
            ProductImage.objects.create(product=product, image=img)

        return product

    def update(self, instance, validated_data):
        additional_images = validated_data.pop('additional_images', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        request = self.context.get("request")
        delete_images = None

        if request:
            delete_images = request.data.get("delete_images")

        if delete_images:
            try:
                image_ids = json.loads(delete_images)
                ProductImage.objects.filter(id__in=image_ids, product=instance).delete()
            except Exception:
                pass

        for img in additional_images:
            ProductImage.objects.create(product=instance, image=img)

        return instance


# ------------------------------
# ✅ NOUVEAU: FAVORITE SERIALIZER
# ------------------------------
class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer pour les favoris"""
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'product', 'created_at']
        read_only_fields = ['id', 'created_at']