import os
import sys
from datetime import datetime, timedelta
from unittest.mock import Mock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import notifications

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


# Dummy factory to emulate SQLAlchemy column comparisons in filters
class _Col:
    def __init__(self, name):
        self.name = name
    def __le__(self, other):
        return ('le', self.name, other)
    def __ge__(self, other):
        return ('ge', self.name, other)
    def __eq__(self, other):
        return ('eq', self.name, other)


def _make_food_model(result_list):
    class Q:
        def filter(self, *args, **kwargs):
            class R:
                def all(self):
                    return result_list
            return R()

    class DummyFood:
        query = Q()
        expiry_date = _Col('expiry_date')
        user_id = _Col('user_id')
        status = _Col('status')

    return DummyFood


def test_get_expiring_foods_returns_foods_within_threshold(monkeypatch):
    user = Mock(id=1, notification_settings={'days_before': 3})
    
    food_item = Mock(
        id=1,
        name='Maçã',
        status='active',
        to_dict=Mock(return_value={'id': 1, 'name': 'Maçã', 'expiry_date': '2025-01-05'})
    )
    
    foods_model = _make_food_model([food_item])
    
    monkeypatch.setattr(notifications, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(notifications, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(notifications, 'Food', foods_model)
    
    with app.test_request_context('/api/notifications/expiring', method='GET'):
        response, status = _unwrap(notifications.get_expiring_foods)()
    
    assert status == 200
    response_data = response.get_json()
    assert len(response_data['notifications']) == 1
    assert response_data['settings']['days_before'] == 3
    assert response_data['settings']['total_expiring'] == 1


def test_get_expiring_foods_returns_empty_list_when_no_expiring_foods(monkeypatch):
    user = Mock(id=1, notification_settings={'days_before': 3})
    
    foods_model = _make_food_model([])
    
    monkeypatch.setattr(notifications, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(notifications, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(notifications, 'Food', foods_model)
    
    with app.test_request_context('/api/notifications/expiring', method='GET'):
        response, status = _unwrap(notifications.get_expiring_foods)()
    
    assert status == 200
    response_data = response.get_json()
    assert response_data['notifications'] == []
    assert response_data['settings']['total_expiring'] == 0
