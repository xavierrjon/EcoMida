import os
import sys
from datetime import datetime, date
from unittest.mock import Mock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import foods

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


def test_update_food_changes_food_fields(monkeypatch):
    user = Mock(id=1)
    food_item = Mock(
        id=1,
        name='Maçã',
        expiry_date=date(2025, 1, 1),
        quantity=1.0,
        food_type='frutas',
    )

    foods_model = Mock()
    foods_model.query.filter_by.return_value.first.return_value = food_item

    monkeypatch.setattr(foods, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(foods, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(foods, 'Food', foods_model)
    session = Mock()
    monkeypatch.setattr(foods.db, 'session', session)
    monkeypatch.setattr(foods, 'History', Mock(return_value=Mock()))

    payload = {
        'name': 'Banana',
        'expiry_date': '2025-02-01',
        'quantity': 3.5,
        'food_type': 'frutas',
    }

    with app.test_request_context('/api/foods/1', method='PUT', json=payload):
        response, status = _unwrap(foods.update_food)(1)

    assert status == 200
    assert response.get_json()['message'] == 'Alimento atualizado com sucesso'
    assert food_item.name == 'Banana'
    assert food_item.quantity == 3.5
    assert food_item.food_type == 'frutas'
    assert food_item.expiry_date == datetime.fromisoformat('2025-02-01').date()
    assert session.commit.call_count == 2
