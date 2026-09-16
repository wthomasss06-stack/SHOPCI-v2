# ecommerce_backend/products/models.py
# VERSION COMPLÈTE avec modèle Favorite

from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone


# ---------------------------------------------------------
# CATEGORY MODEL
# ---------------------------------------------------------
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            i = 1
            while Category.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


# ---------------------------------------------------------
# PRODUCT MODEL
# ---------------------------------------------------------
class Product(models.Model):
    # Vendeur
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        limit_choices_to={'user_type': 'vendeur'},
    )

    # Catégorie
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )

    # Informations
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()

    # Prix
    price = models.DecimalField(max_digits=15, decimal_places=2)
    old_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Stock
    stock = models.PositiveIntegerField(default=0)

    # Image principale
    image = models.ImageField(upload_to='products/%Y/%m/%d/', blank=True, null=True)

    # Stats avancées
    views_count = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    rating = models.FloatField(default=4.8)
    reviews_count = models.PositiveIntegerField(default=0)

    # Statut
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['views_count']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            i = 1
            while Product.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def discount(self):
        if self.old_price and self.old_price > self.price:
            return int(((self.old_price - self.price) / self.old_price) * 100)
        return 0

    @property
    def is_in_stock(self):
        return self.stock > 0

    @property
    def stock_status(self):
        if self.stock == 0:
            return "out"
        if self.stock < 10:
            return "low"
        return "good"

    @property
    def vendor_name(self):
        return self.vendor.username

    @property
    def category_name(self):
        return self.category.name if self.category else None

    @property
    def full_image_url(self):
        try:
            return self.image.url if self.image else None
        except:
            return None


# ---------------------------------------------------------
# PRODUCT IMAGE MODEL
# ---------------------------------------------------------
class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='products/%Y/%m/%d/')
    alt_text = models.CharField(max_length=200, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Image de {self.product.name}"


# ---------------------------------------------------------
# ✅ NOUVEAU: FAVORITE MODEL
# ---------------------------------------------------------
class Favorite(models.Model):
    """
    Favoris liés à l'utilisateur (remplace localStorage)
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'product']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = "Favori"
        verbose_name_plural = "Favoris"

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"