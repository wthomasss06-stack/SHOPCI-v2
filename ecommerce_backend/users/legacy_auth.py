from django.conf import settings
from rest_framework import status
from rest_framework.response import Response


def legacy_password_auth_disabled_response():
    return Response(
        {
            'error': 'Authentification par mot de passe désactivée. Utilisez Google.',
            'code': 'legacy_auth_disabled',
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def is_legacy_password_auth_enabled():
    return getattr(settings, 'LEGACY_PASSWORD_AUTH_ENABLED', False)
