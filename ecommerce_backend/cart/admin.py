# ==================================================
# cart/admin.py
# ==================================================
from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ['product', 'quantity', 'subtotal']
    readonly_fields = ['subtotal']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'items_count', 'total', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    date_hierarchy = 'created_at'
    inlines = [CartItemInline]
    
    readonly_fields = ['total', 'items_count']


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'subtotal', 'created_at']
    list_filter = ['created_at']
    search_fields = ['cart__user__username', 'product__name']
    date_hierarchy = 'created_at'
    
    readonly_fields = ['subtotal']