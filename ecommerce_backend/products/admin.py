# ecommerce_backend/products/admin.py
# VERSION COMPLÈTE avec FavoriteAdmin

from django.contrib import admin
from .models import Category, Product, ProductImage, Favorite


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    date_hierarchy = 'created_at'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'category', 'price', 'stock', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_featured', 'category', 'created_at']
    search_fields = ['name', 'description', 'vendor__username']
    prepopulated_fields = {'slug': ('name',)}
    date_hierarchy = 'created_at'
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('vendor', 'name', 'slug', 'description', 'category')
        }),
        ('Prix et Stock', {
            'fields': ('price', 'old_price', 'stock')
        }),
        ('Médias', {
            'fields': ('image',)
        }),
        ('Options', {
            'fields': ('is_active', 'is_featured')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            if request.user.user_type == 'vendeur':
                obj.vendor = request.user
        super().save_model(request, obj, form, change)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'image', 'created_at']
    list_filter = ['created_at']
    search_fields = ['product__name', 'alt_text']
    date_hierarchy = 'created_at'


# ✅ NOUVEAU: Admin Favoris
@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'product__name']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        # Les favoris sont gérés via l'API, pas l'admin
        return False