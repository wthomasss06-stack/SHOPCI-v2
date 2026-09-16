# ==================================================
# users/admin.py
# ==================================================
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'is_staff', 'date_joined']
    list_filter = ['user_type', 'is_staff', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'phone']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('phone', 'address', 'user_type')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('email', 'phone', 'address', 'user_type')
        }),
    )






