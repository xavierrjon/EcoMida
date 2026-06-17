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


def test_get_notification_settings_returns_user_settings(monkeypatch):
    user_settings = {
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
    
    user = Mock(id=1, notification_settings=user_settings)
    
    monkeypatch.setattr(notifications, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(notifications, 'get_user_from_jwt_identity', Mock(return_value=user))
    
    with app.test_request_context('/api/notifications/settings', method='GET'):
        response, status = _unwrap(notifications.get_notification_settings)()
    
    assert status == 200
    response_data = response.get_json()
    assert response_data['settings'] == user_settings
    assert response_data['settings']['days_before'] == 3
    assert response_data['settings']['enabled'] is True
