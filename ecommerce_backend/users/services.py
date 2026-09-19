# ecommerce_backend/users/services.py
"""
Couche service — logique métier de l'app users, séparée des vues HTTP.

ADR-05 (architecture graduée) : ce module n'est PAS une Clean Architecture
complète (domain/application/infrastructure/presentation) — ça, c'est réservé
au futur module paiement, là où l'argent bouge. Ici, c'est un premier niveau
d'extraction (Niveau B) : les vues restent responsables du HTTP (statuts,
permissions, throttling), ce fichier porte les règles métier et l'accès aux
données. Objectif : pouvoir tester et faire évoluer la logique d'auth sans
dépendre de DRF, pas construire une architecture en couches complète.
"""
import urllib.request

from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class GoogleAuthError(Exception):
    """Erreur d'authentification Google — porte le détail et le code HTTP à renvoyer."""
    def __init__(self, detail, status_code):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class OnboardingError(Exception):
    """Erreur de validation lors de la finalisation d'inscription."""
    def __init__(self, detail, status_code=400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


def issue_tokens_for_user(user):
    """JWT access + refresh pour un utilisateur — un seul endroit, plus de triplication."""
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


def sync_google_profile_photo(user, picture_url):
    """Télécharge la photo Google si l'utilisateur n'en a pas encore."""
    if not picture_url or user.profile_photo:
        return
    try:
        req = urllib.request.Request(picture_url, headers={'User-Agent': 'ShopCI/1.0'})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
        if not data:
            return
        user.profile_photo.save(f'google_{user.pk}.jpg', ContentFile(data), save=True)
    except Exception:
        pass


def verify_google_id_token(id_token_str):
    """Vérifie l'ID token directement auprès de Google. Ne fait confiance à rien côté client."""
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleAuthError(
            {'error': "Authentification Google non configurée côté serveur."},
            503,
        )

    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        payload = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise GoogleAuthError({'error': 'Token Google invalide ou expiré'}, 401)

    if not payload.get('email') or not payload.get('email_verified'):
        raise GoogleAuthError({'error': 'Email Google non vérifié'}, 401)

    return payload


def get_or_create_user_from_google(payload):
    """Retrouve l'utilisateur par email, ou le crée (compte sans mot de passe utilisable)."""
    email = payload['email']
    user = User.objects.filter(email=email).first()

    if user is None:
        base_username = email.split('@')[0][:25] or 'user'
        username = base_username
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base_username}{suffix}"

        full_name = (payload.get('name') or '').split(' ', 1)
        user = User.objects.create(
            username=username,
            email=email,
            first_name=full_name[0] if full_name else '',
            last_name=full_name[1] if len(full_name) > 1 else '',
            user_type='acheteur',
        )
        user.set_unusable_password()  # ce compte ne se connecte que via Google
        user.save()

    sync_google_profile_photo(user, payload.get('picture'))
    return user


def complete_onboarding(user, *, first_name, last_name, user_type, cgu_accepted, profile_photo=None):
    """Valide et applique les 3 étapes de l'onboarding (nom, type de compte, CGU)."""
    from ecommerce_backend.upload_validators import validate_uploaded_image

    first_name = (first_name or '').strip()
    last_name = (last_name or '').strip()

    if not first_name:
        raise OnboardingError({'first_name': 'Le prénom est requis.'})
    if not last_name:
        raise OnboardingError({'last_name': 'Le nom est requis.'})
    if user_type not in dict(User.USER_TYPE_CHOICES):
        raise OnboardingError({'user_type': 'Le type d\u2019utilisateur est invalide.'})

    if isinstance(cgu_accepted, str):
        cgu_accepted = cgu_accepted.lower() == 'true'
    if not cgu_accepted:
        raise OnboardingError({'cgu_accepted': 'Tu dois accepter les CGU pour continuer.'})

    user.first_name = first_name
    user.last_name = last_name
    user.user_type = user_type
    user.cgu_accepted = True
    user.onboarding_completed = True

    update_fields = ['first_name', 'last_name', 'user_type', 'cgu_accepted', 'onboarding_completed']

    if profile_photo:
        try:
            validate_uploaded_image(profile_photo, field_name='profile_photo')
        except Exception as exc:
            detail = getattr(exc, 'detail', {'profile_photo': str(exc)})
            raise OnboardingError(detail)
        user.profile_photo = profile_photo
        update_fields.append('profile_photo')

    user.save(update_fields=update_fields)
    return user
