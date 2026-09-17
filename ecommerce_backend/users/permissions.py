from rest_framework.permissions import BasePermission


class IsVendor(BasePermission):
    """Accès réservé aux comptes vendeur actifs."""

    message = 'Seuls les vendeurs peuvent effectuer cette action.'

    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and getattr(user, 'user_type', None) == 'vendeur'
            and getattr(user, 'account_status', 'active') == 'active'
            and user.is_active
        )


class IsActiveAccount(BasePermission):
    """Refuse les comptes suspendus ou supprimés."""

    message = 'Ce compte est suspendu ou supprimé.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            getattr(user, 'account_status', 'active') == 'active'
            and user.is_active
        )
