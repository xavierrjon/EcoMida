import re
from models.user import User, db

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # Mínimo 6 caracteres
    return len(password) >= 6

def validate_user_data(username, email, password):
    errors = []
    
    if len(username) < 3:
        errors.append("Username deve ter pelo menos 3 caracteres")
    
    if not validate_email(email):
        errors.append("Email inválido")
    
    if not validate_password(password):
        errors.append("Senha deve ter pelo menos 6 caracteres")
    
    return errors


def get_user_from_jwt_identity(identity):
    """Resolve o usuario a partir da identidade JWT.

    Compatibilidade:
    - Novo formato: user_id (int/str numerica)
    - Formato legado: email (str)
    """
    if identity is None:
        return None

    if isinstance(identity, int):
        return db.session.get(User, identity)

    if isinstance(identity, str):
        normalized = identity.strip()
        if normalized.isdigit():
            return db.session.get(User, int(normalized))
        if '@' in normalized:
            return User.query.filter_by(email=normalized.lower()).first()

    return None