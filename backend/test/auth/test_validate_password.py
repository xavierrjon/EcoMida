import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from routes.auth import validate_password


@pytest.mark.parametrize(
    "password",
    [
        "123456",
        "password",
        "passw0rd!",
        "abcdef",
    ],
)
def test_validate_password_accepts_passwords_with_at_least_six_characters(password):
    assert validate_password(password) is True


@pytest.mark.parametrize(
    "password",
    [
        "",
        "123",
        "abcde",
    ],
)
def test_validate_password_rejects_short_passwords(password):
    assert validate_password(password) is False
