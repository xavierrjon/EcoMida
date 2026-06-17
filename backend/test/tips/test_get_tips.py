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


def test_get_tips_without_auth_returns_active_tips(monkeypatch):
    tip1 = Mock(id=1, to_dict=Mock(return_value={'id': 1, 'title': 't1'}))
    tip2 = Mock(id=2, to_dict=Mock(return_value={'id': 2, 'title': 't2'}))

    tips_model = Mock()
    tips_model.query.filter_by.return_value.all.return_value = [tip1, tip2]

    monkeypatch.setattr(tips, 'get_jwt_identity', Mock(return_value=None))
    monkeypatch.setattr(tips, 'Tip', tips_model)

    with app.test_request_context('/api/tips', method='GET'):
        response, status = _unwrap(tips.get_tips)()

    assert status == 200
    data = response.get_json()
    assert len(data['tips']) == 2
    assert all(not t.get('is_favorite') for t in data['tips'])


def test_get_tips_with_auth_marks_favorites(monkeypatch):
    user = Mock(id=1)
    tip1 = Mock(id=1, to_dict=Mock(return_value={'id': 1, 'title': 't1'}))
    tip2 = Mock(id=2, to_dict=Mock(return_value={'id': 2, 'title': 't2'}))

    tips_model = Mock()
    tips_model.query.filter_by.return_value.all.return_value = [tip1, tip2]

    fav_model = Mock()
    fav_model.query.filter_by.return_value.all.return_value = [Mock(tip_id=2)]

    monkeypatch.setattr(tips, 'get_jwt_identity', Mock(return_value=1))
    monkeypatch.setattr(tips, 'get_user_from_jwt_identity', Mock(return_value=user))
    monkeypatch.setattr(tips, 'Tip', tips_model)
    monkeypatch.setattr(tips, 'UserTipFavorite', fav_model)

    with app.test_request_context('/api/tips', method='GET'):
        response, status = _unwrap(tips.get_tips)()

    assert status == 200
    data = response.get_json()
    assert any(t.get('is_favorite') for t in data['tips'])
    assert [t['id'] for t in data['tips'] if t['is_favorite']] == [2]
