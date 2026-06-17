import os
import sys
from unittest.mock import Mock
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from models.favorites import UserTipFavorite
from routes import tips

app = Flask(__name__)


def _unwrap(fn):
    return getattr(fn, '__wrapped__', fn)


def test_toggle_favorite_adds_when_not_exists(monkeypatch):
    user = Mock(id=1)
    tip = Mock(id=5)

    tips_model = Mock()
    tips_model.query.get.return_value = tip

    fav_model = Mock()
    fav_model.query.filter_by.return_value.first.return_value = None

    db_session = Mock()

    monkeypatch.setattr(tips, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(tips, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(tips, 'Tip', tips_model)
    monkeypatch.setattr(tips, 'UserTipFavorite', fav_model)
    monkeypatch.setattr(tips.db, 'session', db_session)

    with app.test_request_context('/api/tips/5/favorite', method='POST'):
        response, status = _unwrap(tips.toggle_favorite)(5)

    assert status == 200
    assert response.get_json()['is_favorite'] is True
    db_session.add.assert_called_once()
    db_session.commit.assert_called_once()


def test_toggle_favorite_removes_when_exists(monkeypatch):
    user = Mock(id=1)
    tip = Mock(id=5)

    tips_model = Mock()
    tips_model.query.get.return_value = tip

    existing_fav = Mock()
    fav_model = Mock()
    fav_model.query.filter_by.return_value.first.return_value = existing_fav

    db_session = Mock()

    monkeypatch.setattr(tips, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(tips, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(tips, 'Tip', tips_model)
    monkeypatch.setattr(tips, 'UserTipFavorite', fav_model)
    monkeypatch.setattr(tips.db, 'session', db_session)

    with app.test_request_context('/api/tips/5/favorite', method='POST'):
        response, status = _unwrap(tips.toggle_favorite)(5)

    assert status == 200
    assert response.get_json()['is_favorite'] is False
    db_session.delete.assert_called_once_with(existing_fav)
    db_session.commit.assert_called_once()
