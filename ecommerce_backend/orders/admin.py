
# ==================================================
# orders/admin.py
# ==================================================
from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ['product_name', 'quantity', 'price', 'subtotal']
    readonly_fields = ['subtotal', 'product_name']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'buyer', 'status', 'total_amount', 
        'items_count', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'updated_at']
    search_fields = ['buyer__username', 'buyer__email', 'delivery_address']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    
    readonly_fields = ['total_amount', 'items_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informations de commande', {
            'fields': ('buyer', 'status', 'total_amount', 'items_count')
        }),
        ('Livraison', {
            'fields': ('delivery_address', 'phone')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'delivered_at')
        }),
    )
    
    actions = ['mark_as_processing', 'mark_as_shipped', 'mark_as_delivered']
    
    def mark_as_processing(self, request, queryset):
        queryset.update(status='processing')
        self.message_user(request, f"{queryset.count()} commande(s) marquée(s) comme en cours")
    mark_as_processing.short_description = "Marquer comme en cours"
    
    def mark_as_shipped(self, request, queryset):
        queryset.update(status='shipped')
        self.message_user(request, f"{queryset.count()} commande(s) marquée(s) comme expédiée(s)")
    mark_as_shipped.short_description = "Marquer comme expédié"
    
    def mark_as_delivered(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='delivered', delivered_at=timezone.now())
        self.message_user(request, f"{queryset.count()} commande(s) marquée(s) comme livrée(s)")
    mark_as_delivered.short_description = "Marquer comme livré"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'quantity', 'price', 'subtotal']
    list_filter = ['created_at']
    search_fields = ['order__id', 'product_name', 'order__buyer__username']
    date_hierarchy = 'created_at'
    
    readonly_fields = ['subtotal']