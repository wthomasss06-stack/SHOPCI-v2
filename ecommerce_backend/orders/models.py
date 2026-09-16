# ecommerce_backend/orders/models.py

from django.db import models
from django.conf import settings
from products.models import Product


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',    'En attente'),
        ('processing', 'En cours de traitement'),
        ('shipped',    'Expédié'),
        ('delivered',  'Livré'),
        ('cancelled',  'Annulé'),
    ]

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name="Acheteur"
    )

    # Livraison
    delivery_address = models.TextField(verbose_name="Adresse de livraison")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")

    # Statut & montant
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='pending', verbose_name="Statut"
    )
    total_amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        verbose_name="Montant total (FCFA)"
    )

    notes = models.TextField(blank=True, null=True, verbose_name="Notes")

    # ── GPS & LIVRAISON TEMPS RÉEL ────────────────────────────────────────
    vendor_lat = models.FloatField(
        null=True, blank=True,
        verbose_name="Latitude livreur"
    )
    vendor_lng = models.FloatField(
        null=True, blank=True,
        verbose_name="Longitude livreur"
    )
    vendor_location_updated = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Dernière mise à jour GPS livreur"
    )
    estimated_minutes = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Temps de livraison estimé (minutes)"
    )
    package_photo = models.ImageField(
        upload_to='orders/packages/%Y/%m/%d/',
        blank=True, null=True,
        verbose_name="Photo du colis"
    )
    delivery_confirmed_by_vendor = models.BooleanField(
        default=False,
        verbose_name="Arrivée confirmée par le vendeur"
    )
    delivery_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        verbose_name="Note de livraison (1-5)"
    )
    # ─────────────────────────────────────────────────────────────────────

    # Dates
    created_at   = models.DateTimeField(auto_now_add=True, verbose_name="Date de commande")
    updated_at   = models.DateTimeField(auto_now=True,     verbose_name="Dernière modification")
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de livraison")

    class Meta:
        verbose_name        = "Commande"
        verbose_name_plural = "Commandes"
        ordering            = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Commande #{self.id} - {self.buyer.username}"

    @property
    def buyer_name(self):
        return self.buyer.username

    @property
    def status_display(self):
        return self.get_status_display()

    @property
    def items_count(self):
        return self.items.count()

    @property
    def total_quantity(self):
        return sum(item.quantity for item in self.items.all())

    def update_total(self):
        self.total_amount = sum(item.subtotal for item in self.items.all())
        self.save()

    def mark_as_delivered(self):
        from django.utils import timezone
        self.status       = 'delivered'
        self.delivered_at = timezone.now()
        self.save()

    @property
    def vendor_location(self):
        """Retourne {'lat': ..., 'lng': ...} si le livreur a partagé sa position"""
        if self.vendor_lat is not None and self.vendor_lng is not None:
            return {'lat': self.vendor_lat, 'lng': self.vendor_lng}
        return None


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE,
        related_name='items', verbose_name="Commande"
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL,
        null=True, verbose_name="Produit"
    )

    # Snapshot produit au moment de la commande
    product_name  = models.CharField(max_length=200, verbose_name="Nom du produit")
    product_image = models.ImageField(
        upload_to='orders/%Y/%m/%d/',
        blank=True, null=True, verbose_name="Image du produit"
    )

    quantity = models.PositiveIntegerField(verbose_name="Quantité")
    price    = models.DecimalField(
        max_digits=15, decimal_places=2,
        verbose_name="Prix unitaire (FCFA)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'ajout")

    class Meta:
        verbose_name        = "Item de commande"
        verbose_name_plural = "Items de commande"
        ordering            = ['created_at']
        indexes = [models.Index(fields=['order', 'product'])]

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def subtotal(self):
        return self.price * self.quantity

    def save(self, *args, **kwargs):
        if not self.pk and self.product:
            self.product_name = self.product.name
            if self.product.image:
                self.product_image = self.product.image
            self.price = self.product.price
        super().save(*args, **kwargs)