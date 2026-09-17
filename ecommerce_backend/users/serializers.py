# ecommerce_backend/users/serializers.py

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from .account_restrictions import is_cooldown_over, build_cooldown_error


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les informations utilisateur"""
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone', 'address',
            'user_type', 'profile_photo', 'profile_photo_url', 'cgu_accepted',
            'onboarding_completed', 'account_status', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'account_status']
    
    def get_profile_photo_url(self, obj):
        """Retourne l'URL complète de la photo de profil"""
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription"""
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'phone', 'address', 'user_type']

    def validate_email(self, value):
        existing = User.objects.filter(email=value).first()
        if not existing:
            return value
        if existing.account_status == 'active':
            raise serializers.ValidationError('Cet email est déjà utilisé.')
        if existing.account_status == 'suspended':
            if not is_cooldown_over(existing):
                err = build_cooldown_error(existing, 'suspendu')
                raise serializers.ValidationError(err['error'])
            raise serializers.ValidationError(
                'Cet email est déjà associé à un compte suspendu. Reconnectez-vous pour le réactiver.'
            )
        if existing.account_status == 'deleted' and not is_cooldown_over(existing):
            err = build_cooldown_error(
                existing,
                'suspendu' if existing.account_status == 'suspended' else 'supprimé',
            )
            raise serializers.ValidationError(err['error'])
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data.get('email')
        existing = User.objects.filter(email=email).first()

        if existing and existing.account_status == 'deleted' and is_cooldown_over(existing):
            password = validated_data.pop('password')
            existing.username = validated_data.get('username', existing.username)
            existing.phone = validated_data.get('phone', existing.phone)
            existing.address = validated_data.get('address', existing.address)
            existing.user_type = validated_data.get('user_type', existing.user_type)
            existing.set_password(password)
            existing.reactivate_from_deletion()
            return existing

        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil"""
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username', 'email', 'phone', 'address',
            'profile_photo', 'user_type', 'cgu_accepted', 'onboarding_completed'
        ]

    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_username(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour le changement de mot de passe"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        write_only=True,
        validators=[validate_password]
    )


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer pour la demande de réinitialisation de mot de passe"""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer pour la confirmation de réinitialisation"""
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )