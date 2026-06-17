import os
import sys
from unittest.mock import Mock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import notifications

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


def test_update_notification_settings_merges_settings(monkeypatch):
    user = Mock(
        id=1,
        notification_settings={
            'enabled': True,
            'days_before': 3,
            'push_notifications': True,
            'email_notifications': False,
            'alert_sound': True,
            'quiet_hours': {
                'enabled': False,
                'start': '22:00',
                'end': '08:00'
            }
        }
    )
    
    monkeypatch.setattr(notifications, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(notifications, 'get_user_from_jwt_identity', Mock(return_value=user))
    session = Mock()
    monkeypatch.setattr(notifications.db, 'session', session)
    
    payload = {
        'notification_settings': {
            'days_before': 7,
            'push_notifications': False
        }
    }
    
    with app.test_request_context('/api/notifications/settings', method='PUT', json=payload):
        response, status = _unwrap(notifications.update_notification_settings)()
    
    assert status == 200
    response_data = response.get_json()
    assert response_data['message'] == 'Configurações atualizadas com sucesso'
    assert user.notification_settings['days_before'] == 7
    assert user.notification_settings['push_notifications'] is False
    assert user.notification_settings['enabled'] is True
    session.commit.assert_called_once()
