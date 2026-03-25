from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import logging
from models.user import User, db
from models.food import Food

notifications_bp = Blueprint('notifications_api', __name__) 
logger = logging.getLogger(__name__)

@notifications_bp.route('/expiring', methods=['GET'])
@jwt_required()
def get_expiring_foods():
    """Retorna alimentos próximos do vencimento do usuário logado"""
    try:
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        days_before = user.notification_settings.get('days_before', 3)
        today = datetime.utcnow().date()
        threshold_date = today + timedelta(days=days_before)
        
        expiring_foods = Food.query.filter(
            Food.user_id == user.id,
            Food.status == 'active',
            Food.expiry_date <= threshold_date,
            Food.expiry_date >= today
        ).all()
        
        notifications = []
        for food in expiring_foods:
            food_dict = food.to_dict()
            notifications.append(food_dict)

        return jsonify({
            "notifications": notifications,
            "settings": {
                "days_before": days_before,
                "total_expiring": len(notifications),
                "user_settings": user.notification_settings
            }
        }), 200
        
    except Exception as e:
        logger.exception("Erro ao buscar notificacoes de vencimento")
        return jsonify({"error": "Erro interno do servidor"}), 500

@notifications_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_notification_settings():
    """Retorna as configurações de notificação do usuário"""
    try:
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        return jsonify({
            "settings": user.notification_settings
        }), 200
        
    except Exception as e:
        logger.exception("Erro ao obter configuracoes de notificacao")
        return jsonify({"error": "Erro interno do servidor"}), 500

@notifications_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_notification_settings():
    """Atualiza as configurações de notificação do usuário"""
    try:
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        if 'notification_settings' in data:
            user.notification_settings = {
                **user.notification_settings,
                **data['notification_settings']
            }
        
        db.session.commit()
        
        return jsonify({
            "message": "Configurações atualizadas com sucesso",
            "settings": user.notification_settings
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao atualizar configuracoes de notificacao")
        return jsonify({"error": "Erro interno do servidor"}), 500

@notifications_bp.route('/test', methods=['GET'])
@jwt_required()
def test_notification():
    """Rota de teste para notificações"""
    return jsonify({
        "message": "Sistema de notificações funcionando!",
        "timestamp": datetime.utcnow().isoformat()
    }), 200