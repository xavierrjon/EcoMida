from flask import jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
import re

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