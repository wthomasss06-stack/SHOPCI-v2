# ecommerce_backend/users/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Modèle utilisateur personnalisé avec types acheteur/vendeur"""
    
    USER_TYPE_CHOICES = [
        ('acheteur', 'Acheteur'),
        ('vendeur', 'Vendeur'),
    ]
    
    ACCOUNT_STATUS_CHOICES = [
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('deleted', 'Supprimé'),
    ]
    
    # Champs personnalisés
    email = models.EmailField(unique=True, verbose_name="Email")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    user_type = models.CharField(
        max_length=10, 
        choices=USER_TYPE_CHOICES, 
        default='acheteur',
        verbose_name="Type d'utilisateur"
    )
    cgu_accepted = models.BooleanField(default=False, verbose_name="CGU acceptées")
    onboarding_completed = models.BooleanField(default=False, verbose_name="Parcours d'onboarding terminé")
    
    # Photo de profil
    profile_photo = models.ImageField(
        upload_to='profile_photos/', 
        blank=True, 
        null=True,
        verbose_name="Photo de profil"
    )
    
    # Statut du compte
    account_status = models.CharField(
        max_length=10,
        choices=ACCOUNT_STATUS_CHOICES,
        default='active',
        verbose_name="Statut du compte"
    )
    
    # Champs de date
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    suspended_at = models.DateTimeField(blank=True, null=True, verbose_name="Date de suspension")
    deleted_at = models.DateTimeField(blank=True, null=True, verbose_name="Date de suppression")
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    @property
    def is_vendor(self):
        """Vérifie si l'utilisateur est un vendeur"""
        return self.user_type == 'vendeur'
    
    @property
    def is_buyer(self):
        """Vérifie si l'utilisateur est un acheteur"""
        return self.user_type == 'acheteur'
    
    @property
    def is_account_active(self):
        """Vérifie si le compte est actif"""
        return self.account_status == 'active' and self.is_active
    
    def suspend_account(self):
        """Suspendre le compte"""
        from django.utils import timezone
        self.account_status = 'suspended'
        self.suspended_at = timezone.now()
        self.is_active = False
        self.save()
    
    def activate_account(self):
        """Réactiver le compte"""
        self.account_status = 'active'
        self.suspended_at = None
        self.is_active = True
        self.save()
    
    def soft_delete(self):
        """Suppression douce du compte"""
        from django.utils import timezone
        self.account_status = 'deleted'
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()

    def reactivate_from_deletion(self):
        """Réactive un compte supprimé après le délai de carence."""
        self.account_status = 'active'
        self.deleted_at = None
        self.suspended_at = None
        self.is_active = True
        self.onboarding_completed = False
        self.cgu_accepted = False
        self.save(
            update_fields=[
                'account_status', 'deleted_at', 'suspended_at', 'is_active',
                'onboarding_completed', 'cgu_accepted',
            ]
        )