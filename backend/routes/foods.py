from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.user import db, User
from models.food import Food
from models.history import History

foods_bp = Blueprint('foods', __name__)

@foods_bp.route('/foods', methods=['POST'])
@jwt_required()
def create_food():
    try:
        current_user_email = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        name = data.get('name')
        expiry_date_str = data.get('expiry_date')
        quantity = data.get('quantity', 1.0) 
        unit = data.get('unit', 'unidades')   
        food_type = data.get('food_type', 'outros')
        
        if not name or not expiry_date_str:
            return jsonify({"error": "Nome e data de validade são obrigatórios"}), 400
        
        try:
            expiry_date = datetime.fromisoformat(expiry_date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return jsonify({"error": "Formato de data inválido. Use YYYY-MM-DD"}), 400
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        new_food = Food(
            name=name,
            expiry_date=expiry_date,
            quantity=quantity,
            unit=unit,  
            food_type=food_type,
            user_id=user.id
        )
        
        db.session.add(new_food)
        db.session.commit()
        
        history_entry = History(
            user_id=user.id,
            food_id=new_food.id,
            action="created",
            food_name=name,
            details={
                "quantity": quantity,
                "unit": unit,  
                "expiry_date": expiry_date_str
            }
        )
        
        db.session.add(history_entry)
        db.session.commit()
        
        return jsonify({
            "message": "Alimento cadastrado com sucesso",
            "food": new_food.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@foods_bp.route('/foods', methods=['GET'])
@jwt_required()
def get_foods():
    try:
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        foods = Food.query.filter_by(user_id=user.id).all()
        
        return jsonify({
            "foods": [food.to_dict() for food in foods]
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@foods_bp.route('/foods/<int:food_id>', methods=['PUT'])
@jwt_required()
def update_food(food_id):
    try:
        current_user_email = get_jwt_identity()
        data = request.get_json()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        food = Food.query.filter_by(id=food_id, user_id=user.id).first()
        if not food:
            return jsonify({"error": "Alimento não encontrado"}), 404
        
        if 'name' in data:
            food.name = data['name']
        if 'expiry_date' in data:
            food.expiry_date = datetime.fromisoformat(data['expiry_date'].replace('Z', '+00:00')).date()
        if 'quantity' in data:
            food.quantity = data['quantity']
        if 'food_type' in data:
            food.food_type = data['food_type']
        
        food.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        history_entry = History(
            user_id=user.id,
            food_id=food.id,
            action="updated",
            food_name=food.name,
            details={"changes": data}
        )
        
        db.session.add(history_entry)
        db.session.commit()
        
        return jsonify({"message": "Alimento atualizado com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@foods_bp.route('/foods/<int:food_id>/consume', methods=['POST'])
@jwt_required()
def mark_as_consumed(food_id):
    return update_food_status(food_id, "consumed")

@foods_bp.route('/foods/<int:food_id>/discard', methods=['POST'])
@jwt_required()
def mark_as_discarded(food_id):
    return update_food_status(food_id, "discarded")

def update_food_status(food_id, status):
    try:
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        food = Food.query.filter_by(id=food_id, user_id=user.id).first()
        if not food:
            return jsonify({"error": "Alimento não encontrado"}), 404
        
        food.status = status
        food.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        action = "consumed" if status == "consumed" else "discarded"
        history_entry = History(
            user_id=user.id,
            food_id=food.id,
            action=action,
            food_name=food.name
        )
        
        db.session.add(history_entry)
        db.session.commit()
        
        action_text = "consumido" if action == "consumed" else "descartado"
        return jsonify({"message": f"Alimento marcado como {action_text} com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@foods_bp.route('/foods/<int:food_id>', methods=['DELETE'])
@jwt_required()
def delete_food(food_id):
    try:
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        food = Food.query.filter_by(id=food_id, user_id=user.id).first()
        if not food:
            return jsonify({"error": "Alimento não encontrado"}), 404
        
        history_entry = History(
            user_id=user.id,
            food_id=food.id,
            action="deleted",
            food_name=food.name
        )
        
        db.session.add(history_entry)
        db.session.delete(food)
        db.session.commit()
        
        return jsonify({"message": "Alimento deletado com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500
    
@foods_bp.route('/foods/<int:food_id>/reactivate', methods=['POST'])
@jwt_required()
def reactivate_food(food_id):
    try:
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        food = Food.query.filter_by(id=food_id, user_id=user.id).first()
        if not food:
            return jsonify({"error": "Alimento não encontrado"}), 404
        
       
        food.status = 'active'
        food.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        history_entry = History(
            user_id=user.id,
            food_id=food.id,
            action="reactivated",
            food_name=food.name
        )
        
        db.session.add(history_entry)
        db.session.commit()
        
        return jsonify({"message": "Alimento reativado com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500