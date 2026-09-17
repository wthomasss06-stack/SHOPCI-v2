from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ActiveUserJWTAuthentication(JWTAuthentication):
    """JWT standard + refus si compte suspendu, supprimé ou inactif."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user.is_active or getattr(user, 'account_status', 'active') != 'active':
            raise AuthenticationFailed(
                'Compte suspendu ou supprimé.',
                code='account_unavailable',
            )
        return user
