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


def test_mark_as_consumed_routes_to_update_food_status(monkeypatch):
    monkeypatch.setattr(foods, 'update_food_status', Mock(return_value=('ok', 200)))

    with app.test_request_context('/api/foods/1/consume', method='POST'):
        response, status = _unwrap(foods.mark_as_consumed)(1)

    assert status == 200
    assert response == 'ok'
    foods.update_food_status.assert_called_once_with(1, 'consumed')
