from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models.user import User
from models.food import Food

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Encontrar alimentos que expiram em até 3 dias
        today = datetime.utcnow().date()
        threshold_date = today + timedelta(days=3)
        
        expiring_foods = Food.query.filter(
            Food.user_id == user.id,
            Food.status == 'active',
            Food.expiry_date <= threshold_date,
            Food.expiry_date >= today
        ).all()
        
        notifications = []
        for food in expiring_foods:
            days_until = (food.expiry_date - today).days
            notifications.append({
                'food_id': food.id,
                'name': food.name,
                'expiry_date': food.expiry_date.isoformat(),
                'days_until': days_until,
                'user_id': food.user_id
            })
        
        return jsonify({"notifications": notifications}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500