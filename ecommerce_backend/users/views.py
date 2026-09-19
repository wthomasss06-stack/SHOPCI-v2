# ecommerce_backend/users/views.py

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import User
from .account_restrictions import log_account_action, resolve_restricted_account
from .legacy_auth import is_legacy_password_auth_enabled, legacy_password_auth_disabled_response
from .permissions import IsActiveAccount
from .services import (
    issue_tokens_for_user,
    verify_google_id_token,
    get_or_create_user_from_google,
    complete_onboarding,
    GoogleAuthError,
    OnboardingError,
)
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer,
)


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = RegisterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def create(self, request, *args, **kwargs):
        if not is_legacy_password_auth_enabled():
            return legacy_password_auth_disabled_response()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': issue_tokens_for_user(user),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Connexion utilisateur"""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        if not is_legacy_password_auth_enabled():
            return legacy_password_auth_disabled_response()
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

            return Response({
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': issue_tokens_for_user(user),
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
    authentication_classes = []  # pas de JWT requis
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'google_auth'

    def post(self, request):
        id_token_str = request.data.get('id_token')
        if not id_token_str:
            return Response({'error': 'id_token requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = verify_google_id_token(id_token_str)
        except GoogleAuthError as exc:
            return Response(exc.detail, status=exc.status_code)

        user = get_or_create_user_from_google(payload)

        ok, error = resolve_restricted_account(user)
        if not ok:
            return Response(error, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': issue_tokens_for_user(user),
        })


class OnboardingView(APIView):
    """Finalisation du parcours d'inscription Google et choix de rôle."""
    permission_classes = [IsAuthenticated, IsActiveAccount]

    def post(self, request):
        user = request.user
        if user.account_status != 'active' or not user.is_active:
            return Response(
                {'error': 'Compte indisponible.', 'code': 'account_unavailable'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = complete_onboarding(
                user,
                first_name=request.data.get('first_name'),
                last_name=request.data.get('last_name'),
                user_type=request.data.get('user_type'),
                cgu_accepted=request.data.get('cgu_accepted'),
                profile_photo=request.FILES.get('profile_photo'),
            )
        except OnboardingError as exc:
            return Response(exc.detail, status=exc.status_code)

        return Response({
            'message': 'Compte finalisé avec succès.',
            'user': UserSerializer(user, context={'request': request}).data,
        })


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """Mise à jour et lecture du profil utilisateur"""
    permission_classes = [IsAuthenticated, IsActiveAccount]
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
        if not is_legacy_password_auth_enabled():
            return legacy_password_auth_disabled_response()
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
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        if not is_legacy_password_auth_enabled():
            return legacy_password_auth_disabled_response()
        email = request.data.get('email')

        try:
            user = User.objects.get(email=email)

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
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_confirm'

    def post(self, request):
        if not is_legacy_password_auth_enabled():
            return legacy_password_auth_disabled_response()
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