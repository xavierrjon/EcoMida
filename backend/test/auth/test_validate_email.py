import os
import sys
import pytest

# Ensure the backend directory is on sys.path so we can import routes.auth
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from routes.auth import validate_email


@pytest.mark.parametrize(
    "email",
    [
        "user@example.com",
        "user.name+tag@example.co",
        "user_name@example-domain.org",
        "user123@example.net",
    ],
)
def test_validate_email_accepts_valid_email_addresses(email):
    assert validate_email(email) is True


@pytest.mark.parametrize(
    "email",
    [
        "",
        "user@",
        "@example.com",
        "userexample.com",
        "user@com",
        "user@.com",
        "user@@example.com",
        None,
    ],
)
def test_validate_email_rejects_invalid_email_addresses(email):
    assert validate_email(email) is False
