from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import db, User
import traceback
import re

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
        print("📝 Tentativa de registro recebida")
        
        # Verificar se há dados JSON
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
            
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        print(f"📧 Dados recebidos - Username: '{username}', Email: '{email}', Password: {'*' * len(password)}")
        
        # Validação dos dados
        errors = validate_user_data(username, email, password)
        if errors:
            print(f"❌ Erros de validação: {errors}")
            return jsonify({"error": "Dados inválidos", "details": errors}), 400
        
        # Verificar se usuário já existe
        if User.query.filter_by(email=email).first():
            print(f"❌ Email já cadastrado: {email}")
            return jsonify({"error": "Email já cadastrado"}), 400
        
        if User.query.filter_by(username=username).first():
            print(f"❌ Username já existe: {username}")
            return jsonify({"error": "Username já existe"}), 400
        
        # Criar novo usuário
        print("✅ Dados válidos, criando usuário...")
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"✅ Usuário criado com ID: {new_user.id}")
        
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
        print(f"❌ Erro no registro: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        print("🔐 Tentativa de login recebida")
        
        # Verificar se há dados JSON
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
            
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({"error": "Email e senha são obrigatórios"}), 400
        
        print(f"🔍 Buscando usuário: {email}")
        # Buscar usuário
        user = User.query.filter_by(email=email).first()
        if not user:
            print("❌ Usuário não encontrado")
            return jsonify({"error": "Credenciais inválidas"}), 401
        
        print(f"✅ Usuário encontrado: {user.username}")
        
        # Verificar senha
        if not user.check_password(password):
            print("❌ Senha incorreta")
            return jsonify({"error": "Credenciais inválidas"}), 401
        
        # Criar token
        access_token = create_access_token(identity=user.email)
        
        print("✅ Login realizado com sucesso")
        
        return jsonify({
            "message": "Login realizado com sucesso",
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Erro no login: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        return jsonify({
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500