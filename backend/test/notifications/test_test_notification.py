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


def test_test_notification_returns_success_message(monkeypatch):
    monkeypatch.setattr(notifications, 'get_jwt_identity', Mock(return_value=1))
    
    with app.test_request_context('/api/notifications/test', method='GET'):
        response, status = _unwrap(notifications.test_notification)()
    
    assert status == 200
    response_data = response.get_json()
    assert response_data['message'] == 'Sistema de notificações funcionando!'
    assert 'timestamp' in response_data
