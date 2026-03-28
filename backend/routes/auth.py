from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import db, User
from utils.auth import get_user_from_jwt_identity
import re
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    try:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    except:
        return False

def validate_password(password):
    return len(password) >= 6

def validate_user_data(username, email, password):
    errors = []
    
    if not username or len(username) < 3:
        errors.append("Username deve ter pelo menos 3 caracteres")
    
    if not email or not validate_email(email):
        errors.append("Email inválido")
    
    if not password or not validate_password(password):
        errors.append("Senha deve ter pelo menos 6 caracteres")
    
    return errors

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
            
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        errors = validate_user_data(username, email, password)
        if errors:
            return jsonify({"error": "Dados inválidos", "details": errors}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email já cadastrado"}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username já existe"}), 400

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "message": "Usuário criado com sucesso",
            "user": {
                "id": new_user.id,
                "username": username,
                "email": email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro no registro")
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
            
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({"error": "Email e senha são obrigatórios"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado!"}), 401

        if not user.check_password(password):
            return jsonify({"error": "Senha incorreta!"}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "message": "Login realizado com sucesso",
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        logger.exception("Erro no login")
        return jsonify({"error": "Erro interno do servidor"}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Retorna os dados do perfil do usuário logado"""
    try:
        current_identity = get_jwt_identity()
        user = get_user_from_jwt_identity(current_identity)
        
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        return jsonify({
            "profile": user.to_dict()
        }), 200
        
    except Exception as e:
        logger.exception("Erro ao obter perfil")
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Atualiza os dados do perfil do usuário"""
    try:
        current_identity = get_jwt_identity()
        user = get_user_from_jwt_identity(current_identity)
        
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        # Atualizar campos permitidos
        if 'username' in data and data['username']:
            # Verificar se username já existe (exceto para o próprio usuário)
            existing_user = User.query.filter(
                User.username == data['username'],
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({"error": "Nome de usuário já está em uso"}), 400
            user.username = data['username']
        
        if 'email' in data and data['email']:
            # Verificar se email já existe (exceto para o próprio usuário)
            existing_user = User.query.filter(
                User.email == data['email'],
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({"error": "Email já está em uso"}), 400
            user.email = data['email']
        
        # Atualizar configurações de acessibilidade se fornecidas
        if 'accessibility_settings' in data:
            user.accessibility_settings = {
                **user.accessibility_settings,
                **data['accessibility_settings']
            }
        
        db.session.commit()
        
        return jsonify({
            "message": "Perfil atualizado com sucesso",
            "profile": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao atualizar perfil")
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Faz logout do usuário"""
    try:
        return jsonify({
            "message": "Logout realizado com sucesso"
        }), 200
        
    except Exception as e:
        logger.exception("Erro no logout")
        return jsonify({"error": "Erro interno do servidor"}), 500
    
# routes/auth.py - ADICIONE esta rota para mudança de senha
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Altera a senha do usuário"""
    try:
        current_identity = get_jwt_identity()
        user = get_user_from_jwt_identity(current_identity)
        
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({"error": "Senha atual e nova senha são obrigatórias"}), 400
        
        # Verificar senha atual
        if not user.check_password(current_password):
            return jsonify({"error": "Senha atual incorreta"}), 400
        
        # Validar nova senha
        if not validate_password(new_password):
            return jsonify({"error": "Nova senha deve ter pelo menos 6 caracteres"}), 400
        
        # Alterar senha
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            "message": "Senha alterada com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao alterar senha")
        return jsonify({"error": "Erro interno do servidor"}), 500