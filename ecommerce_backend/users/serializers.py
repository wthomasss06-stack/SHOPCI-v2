# ecommerce_backend/users/serializers.py

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les informations utilisateur"""
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'address', 
            'user_type', 'profile_photo', 'profile_photo_url',
            'account_status', 'date_joined'
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

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
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
        fields = ['username', 'email', 'phone', 'address', 'profile_photo']

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