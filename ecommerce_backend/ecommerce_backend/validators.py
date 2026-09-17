"""Validateurs partagés (uploads, etc.)."""

from PIL import Image
from django.conf import settings
from django.core.exceptions import ValidationError


def _detect_image_type(uploaded_file):
    try:
        uploaded_file.seek(0)
        with Image.open(uploaded_file) as img:
            img.verify()
            fmt = (img.format or '').lower()
        uploaded_file.seek(0)
        return fmt
    except Exception:
        uploaded_file.seek(0)
        return None


def validate_uploaded_image(uploaded_file, field_name='fichier'):
    """Valide taille et type MIME réel d'une image uploadée."""
    if uploaded_file is None:
        return

    max_bytes = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 5 * 1024 * 1024)
    if uploaded_file.size > max_bytes:
        raise ValidationError(
            f"Le {field_name} ne doit pas dépasser {max_bytes // (1024 * 1024)} Mo."
        )

    allowed = getattr(
        settings,
        'ALLOWED_IMAGE_TYPES',
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    )
    content_type = getattr(uploaded_file, 'content_type', '') or ''
    if content_type and content_type not in allowed:
        raise ValidationError(
            f"Type de {field_name} non autorisé ({content_type}). "
            f"Formats acceptés : {', '.join(allowed)}."
        )

    detected = _detect_image_type(uploaded_file)
    ext_map = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
    }
    detected_type = ext_map.get(detected)
    if not detected_type or detected_type not in allowed:
        raise ValidationError(
            f"Le {field_name} n'est pas une image valide (jpeg, png, gif, webp)."
        )
