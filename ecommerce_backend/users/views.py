# ecommerce_backend/users/views.py

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import User
from .account_restrictions import log_account_action, resolve_restricted_account
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer,
)

import urllib.request
from django.core.files.base import ContentFile


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


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Connexion utilisateur"""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=username, password=password)

        if user is None:
            try:
                candidate = User.objects.get(username=username)
                if candidate.check_password(password):
                    user = candidate
            except User.DoesNotExist:
                user = None

        if user is not None:
            ok, error = resolve_restricted_account(user)
            if not ok:
                return Response(error, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        
        return Response(
            {'error': 'Nom d\'utilisateur ou mot de passe incorrect'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class GoogleAuthView(APIView):
    """
    Échange un ID token Google (vérifié côté NextAuth) contre les JWT internes.
    Ne fait confiance à rien venant du client : le token est re-vérifié ici,
    côté serveur, directement auprès de Google.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'google_auth'

    def post(self, request):
        id_token_str = request.data.get('id_token')
        if not id_token_str:
            return Response({'error': 'id_token requis'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {'error': "Authentification Google non configurée côté serveur."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        try:
            payload = google_id_token.verify_oauth2_token(
                id_token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return Response({'error': 'Token Google invalide ou expiré'}, status=status.HTTP_401_UNAUTHORIZED)

        email = payload.get('email')
        if not email or not payload.get('email_verified'):
            return Response({'error': 'Email Google non vérifié'}, status=status.HTTP_401_UNAUTHORIZED)

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
        else:
            sync_google_profile_photo(user, payload.get('picture'))

        ok, error = resolve_restricted_account(user)
        if not ok:
            return Response(error, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class OnboardingView(APIView):
    """Finalisation du parcours d'inscription Google et choix de rôle."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        first_name = (request.data.get('first_name') or '').strip()
        last_name = (request.data.get('last_name') or '').strip()
        user_type = request.data.get('user_type')
        cgu_accepted = request.data.get('cgu_accepted')

        if not first_name:
            return Response({'first_name': 'Le prénom est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        if not last_name:
            return Response({'last_name': 'Le nom est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        if user_type not in dict(User.USER_TYPE_CHOICES):
            return Response({'user_type': 'Le type d’utilisateur est invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if isinstance(cgu_accepted, str):
            cgu_accepted = cgu_accepted.lower() == 'true'
        if not cgu_accepted:
            return Response({'cgu_accepted': 'Tu dois accepter les CGU pour continuer.'}, status=status.HTTP_400_BAD_REQUEST)

        user.first_name = first_name
        user.last_name = last_name
        user.user_type = user_type
        user.cgu_accepted = True
        user.onboarding_completed = True

        update_fields = ['first_name', 'last_name', 'user_type', 'cgu_accepted', 'onboarding_completed']
        if request.FILES.get('profile_photo'):
            user.profile_photo = request.FILES['profile_photo']
            update_fields.append('profile_photo')
        user.save(update_fields=update_fields)

        return Response({
            'message': 'Compte finalisé avec succès.',
            'user': UserSerializer(user, context={'request': request}).data,
        })


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """Mise à jour et lecture du profil utilisateur"""
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'Profil mis à jour avec succès',
            'user': UserSerializer(instance, context={'request': request}).data
        })


class ChangePasswordView(APIView):
    """Changement de mot de passe pour utilisateur connecté"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        if not user.check_password(old_password):
            return Response(
                {'old_password': 'Ancien mot de passe incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Mot de passe modifié avec succès'})


class SuspendAccountView(APIView):
    """Suspendre le compte de l'utilisateur"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.suspend_account()
        log_account_action(user, 'suspended')

        return Response({
            'message': 'Votre compte a été suspendu avec succès'
        })


class DeleteAccountView(APIView):
    """Supprimer définitivement le compte de l'utilisateur"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.soft_delete()
        log_account_action(user, 'deleted')

        return Response({
            'message': 'Votre compte a été supprimé avec succès'
        })


class PasswordResetRequestView(APIView):
    """Demande de réinitialisation de mot de passe"""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = request.data.get('email')
        
        try:
            user = User.objects.get(email=email)
            
            # Génération du token
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # URL de réinitialisation
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            
            # Envoi de l'email
            send_mail(
                'Réinitialisation de votre mot de passe',
                f'Cliquez sur ce lien pour réinitialiser votre mot de passe: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Email de réinitialisation envoyé',
            })
            
        except User.DoesNotExist:
            # Ne pas révéler si l'email existe
            return Response({
                'message': 'Si cet email existe, un lien de réinitialisation a été envoyé'
            })


class PasswordResetConfirmView(APIView):
    """Confirmation de réinitialisation de mot de passe"""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_confirm'

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            token_generator = PasswordResetTokenGenerator()
            
            if token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                
                return Response({
                    'message': 'Mot de passe réinitialisé avec succès'
                })
            else:
                return Response(
                    {'error': 'Token invalide ou expiré'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'Lien invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )