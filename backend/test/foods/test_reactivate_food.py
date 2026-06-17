import os
import sys
from datetime import datetime
from unittest.mock import Mock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import foods

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


def test_reactivate_food_sets_status_active(monkeypatch):
    user = Mock(id=1)
    food_item = Mock(id=1, name='Maçã', status='discarded')

    foods_model = Mock()
    foods_model.query.filter_by.return_value.first.return_value = food_item

    monkeypatch.setattr(foods, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(foods, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(foods, 'Food', foods_model)
    session = Mock()
    monkeypatch.setattr(foods.db, 'session', session)
    monkeypatch.setattr(foods, 'History', Mock(return_value=Mock()))

    with app.test_request_context('/api/foods/1/reactivate', method='POST'):
        response, status = _unwrap(foods.reactivate_food)(1)

    assert status == 200
    assert response.get_json()['message'] == 'Alimento reativado com sucesso'
    assert food_item.status == 'active'
    assert isinstance(food_item.updated_at, datetime)
