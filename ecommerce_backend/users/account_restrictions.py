"""Journal JSON + délai de 1 jour avant réactivation / recréation de compte."""

from __future__ import annotations

import json
import uuid
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.utils import timezone

COOLDOWN_DAYS = getattr(settings, 'ACCOUNT_COOLDOWN_DAYS', 1)
LOG_FILENAME = 'account_status_log.json'


def _log_path() -> Path:
    log_dir = Path(getattr(settings, 'ACCOUNT_STATUS_LOG_DIR', settings.BASE_DIR / 'logs'))
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / LOG_FILENAME


def _load_log() -> list:
    path = _log_path()
    if not path.exists():
        return []
    try:
        with path.open('r', encoding='utf-8') as fh:
            data = json.load(fh)
        return data if isinstance(data, list) else data.get('entries', [])
    except (json.JSONDecodeError, OSError):
        return []


def _save_log(entries: list) -> None:
    path = _log_path()
    with path.open('w', encoding='utf-8') as fh:
        json.dump(entries, fh, ensure_ascii=False, indent=2)


def log_account_action(user, action: str) -> dict:
    """Enregistre suspension ou suppression avec date de réactivation possible."""
    now = timezone.now()
    eligible_at = now + timedelta(days=COOLDOWN_DAYS)
    entry = {
        'id': str(uuid.uuid4()),
        'user_id': user.id,
        'email': user.email,
        'username': user.username,
        'action': action,
        'at': now.isoformat(),
        'eligible_at': eligible_at.isoformat(),
        'cooldown_days': COOLDOWN_DAYS,
    }
    entries = _load_log()
    entries.append(entry)
    _save_log(entries)
    return entry


def get_restriction_started_at(user):
    if user.account_status == 'deleted' and user.deleted_at:
        return user.deleted_at
    if user.account_status == 'suspended' and user.suspended_at:
        return user.suspended_at
    return None


def get_eligible_at(user):
    started = get_restriction_started_at(user)
    if not started:
        return None
    return started + timedelta(days=COOLDOWN_DAYS)


def is_cooldown_over(user) -> bool:
    eligible = get_eligible_at(user)
    if not eligible:
        return True
    return timezone.now() >= eligible


def build_cooldown_error(user, action_label: str) -> dict:
    eligible = get_eligible_at(user)
    eligible_str = eligible.strftime('%d/%m/%Y à %H:%M') if eligible else ''
    return {
        'error': (
            f'Ce compte a été {action_label}. '
            f'Vous pourrez vous reconnecter ou recréer un compte à partir du {eligible_str} '
            f'({COOLDOWN_DAYS} jour{"s" if COOLDOWN_DAYS > 1 else ""} de délai).'
        ),
        'code': 'account_cooldown',
        'account_status': user.account_status,
        'eligible_at': eligible.isoformat() if eligible else None,
        'cooldown_days': COOLDOWN_DAYS,
    }


def resolve_restricted_account(user):
    """
    Gère suspendu / supprimé :
    - délai non écoulé → refus
    - délai écoulé → réactivation automatique
    Retourne (True, None) ou (False, error_dict).
    """
    if user.account_status == 'active' and user.is_active:
        return True, None

    if user.account_status == 'suspended':
        if not is_cooldown_over(user):
            return False, build_cooldown_error(user, 'suspendu')
        user.activate_account()
        log_account_action(user, 'reactivated_after_suspension')
        return True, None

    if user.account_status == 'deleted':
        if not is_cooldown_over(user):
            return False, build_cooldown_error(user, 'supprimé')
        user.reactivate_from_deletion()
        log_account_action(user, 'reactivated_after_deletion')
        return True, None

    return False, {'error': 'Compte indisponible.', 'code': 'account_unavailable'}
