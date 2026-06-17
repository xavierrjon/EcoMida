import os
import sys
from datetime import date
from unittest.mock import Mock

from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import foods

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


def test_create_food_commits_new_food(monkeypatch):
    data = {
        "name": "Maçã",
        "expiry_date": "2025-01-01",
        "quantity": 2.0,
        "unit": "kg",
        "food_type": "frutas",
    }

    monkeypatch.setattr(foods, "get_jwt_identity", Mock(return_value=1))
    monkeypatch.setattr(foods, "get_user_from_jwt_identity", Mock(return_value=Mock(id=1)))
    session = Mock()
    monkeypatch.setattr(foods.db, "session", session)
    monkeypatch.setattr(foods, "History", Mock())

    with app.test_request_context('/api/foods', method='POST', json=data):
        response, status = _unwrap(foods.create_food)()

    assert status == 201
    response_data = response.get_json()
    assert response_data["message"] == "Alimento cadastrado com sucesso"
    assert response_data["food"]["name"] == "Maçã"
    assert session.add.call_count == 2
    assert session.commit.call_count == 2
