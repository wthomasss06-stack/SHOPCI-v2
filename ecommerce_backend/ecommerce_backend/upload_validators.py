"""Validation MIME / taille pour les uploads images."""

import imghdr

from django.conf import settings
from rest_framework.exceptions import ValidationError


def validate_uploaded_image(uploaded_file, field_name='image'):
    if not uploaded_file:
        return

    max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 5 * 1024 * 1024)
    if uploaded_file.size > max_size:
        raise ValidationError({
            field_name: f'Le fichier ne doit pas dépasser {max_size // (1024 * 1024)} Mo.',
        })

    allowed = getattr(
        settings,
        'ALLOWED_IMAGE_TYPES',
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    )
    content_type = (getattr(uploaded_file, 'content_type', '') or '').lower()
    if content_type and content_type not in allowed:
        raise ValidationError({
            field_name: f'Type de fichier non autorisé ({content_type}).',
        })

    header = uploaded_file.read(512)
    uploaded_file.seek(0)
    detected = imghdr.what(None, header)
    ext_map = {
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
    }
    detected_type = ext_map.get(detected)
    if detected_type and detected_type not in allowed:
        raise ValidationError({field_name: 'Contenu du fichier non autorisé.'})
    if not detected_type and content_type not in allowed:
        raise ValidationError({field_name: 'Fichier image invalide ou corrompu.'})


def validate_uploaded_images(files, field_name='images'):
    for f in files or []:
        validate_uploaded_image(f, field_name=field_name)
