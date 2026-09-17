# ecommerce_backend/users/urls.py

from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView
from . import views


class PublicTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('google-auth/', views.GoogleAuthView.as_view(), name='google-auth'),
    path('onboarding/', views.OnboardingView.as_view(), name='onboarding'),
    
    # Profile
    path('profile/', views.ProfileUpdateView.as_view(), name='profile-update'),
    
    # Password Management
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Account Management
    path('suspend-account/', views.SuspendAccountView.as_view(), name='suspend-account'),
    path('delete-account/', views.DeleteAccountView.as_view(), name='delete-account'),
    
    # Token Refresh
    path('token/refresh/', PublicTokenRefreshView.as_view(), name='token-refresh'),
]