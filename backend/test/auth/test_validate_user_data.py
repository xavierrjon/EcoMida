import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from routes.auth import validate_user_data


def test_validate_user_data_returns_no_errors_for_valid_input():
    errors = validate_user_data(
        username="usuario",
        email="usuario@example.com",
        password="senha123",
    )

    assert errors == []


@pytest.mark.parametrize(
    "username,email,password,expected_errors",
    [
        (
            "us",
            "usuario@example.com",
            "senha123",
            ["Username deve ter pelo menos 3 caracteres"],
        ),
        (
            "usuario",
            "usuarioexample.com",
            "senha123",
            ["Email inválido"],
        ),
        (
            "usuario",
            "usuario@example.com",
            "123",
            ["Senha deve ter pelo menos 6 caracteres"],
        ),
        (
            "",
            "invalid",
            "",
            [
                "Username deve ter pelo menos 3 caracteres",
                "Email inválido",
                "Senha deve ter pelo menos 6 caracteres",
            ],
        ),
    ],
)
def test_validate_user_data_returns_expected_errors(username, email, password, expected_errors):
    assert validate_user_data(username, email, password) == expected_errors
