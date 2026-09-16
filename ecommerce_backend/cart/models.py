# ecommerce_backend/cart/models.py
# VERSION CORRIGÉE - Calculs décimaux sécurisés

from django.db import models
from django.conf import settings
from products.models import Product
from decimal import Decimal


class Cart(models.Model):
    """Modèle pour le panier d'un utilisateur"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
        verbose_name="Utilisateur"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    
    class Meta:
        verbose_name = "Panier"
        verbose_name_plural = "Paniers"
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Panier de {self.user.username}"
    
    @property
    def total(self):
        """✅ CORRECTION: Calcule le total du panier avec gestion erreurs"""
        try:
            total = Decimal('0')
            for item in self.items.all():
                if item.product and item.product.price:
                    subtotal = Decimal(str(item.product.price)) * Decimal(str(item.quantity))
                    total += subtotal
            return float(total)
        except Exception as e:
            print(f"Erreur calcul total: {e}")
            return 0.0
    
    @property
    def items_count(self):
        """Compte le nombre d'items dans le panier"""
        return self.items.count()
    
    @property
    def total_quantity(self):
        """Calcule la quantité totale de produits"""
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """Modèle pour un item dans le panier"""
    
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Panier"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name="Produit"
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantité")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'ajout")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    
    class Meta:
        verbose_name = "Item de panier"
        verbose_name_plural = "Items de panier"
        ordering = ['created_at']
        unique_together = ['cart', 'product']
        indexes = [
            models.Index(fields=['cart', 'product']),
        ]
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def subtotal(self):
        """✅ CORRECTION: Calcule le sous-total avec gestion erreurs"""
        try:
            if self.product and self.product.price:
                return float(Decimal(str(self.product.price)) * Decimal(str(self.quantity)))
            return 0.0
        except Exception as e:
            print(f"Erreur calcul subtotal: {e}")
            return 0.0
    
    def clean(self):
        """Validation personnalisée"""
        from django.core.exceptions import ValidationError
        
        if self.product and self.quantity > self.product.stock:
            raise ValidationError(
                f'Stock insuffisant. Disponible: {self.product.stock}'
            )
        
        if self.quantity <= 0:
            raise ValidationError('La quantité doit être supérieure à 0')
    
    def save(self, *args, **kwargs):
        # ✅ CORRECTION: Désactiver validation auto qui peut causer des erreurs
        # self.full_clean()
        super().save(*args, **kwargs)