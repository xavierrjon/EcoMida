import os
import sys
from unittest.mock import Mock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import foods

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


def test_get_foods_returns_user_foods(monkeypatch):
    user = Mock(id=1)
    food_item = Mock(to_dict=Mock(return_value={'id': 1, 'name': 'Maçã'}))

    foods_mock = Mock()
    foods_mock.query.filter_by.return_value.all.return_value = [food_item]

    monkeypatch.setattr(foods, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(foods, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(foods, 'Food', foods_mock)

    with app.test_request_context('/api/foods', method='GET'):
        response, status = _unwrap(foods.get_foods)()

    assert status == 200
    assert response.get_json() == {'foods': [{'id': 1, 'name': 'Maçã'}]}
