from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import db, User
from models.tip import Tip
import logging

logger = logging.getLogger(__name__)

tips_bp = Blueprint('tips', __name__)

@tips_bp.route('/tips', methods=['GET'])
def get_tips():
    try:
        category = request.args.get('category')
        
        query = Tip.query.filter_by(is_active=True)
        if category:
            query = query.filter_by(food_category=category)
        
        tips = query.all()
        
        return jsonify({
            "tips": [tip.to_dict() for tip in tips]
        }), 200
        
    except Exception as e:
        logger.exception("Erro ao buscar dicas")
        return jsonify({"error": "Erro interno do servidor"}), 500

@tips_bp.route('/tips/<int:tip_id>/favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(tip_id):
    try:
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Verificar se a dica existe
        tip = Tip.query.get(tip_id)
        if not tip:
            return jsonify({"error": "Dica não encontrada"}), 404

        # Incrementar contador de favoritos
        tip.favorites_count += 1
        db.session.commit()

        return jsonify({
            "message": "Dica favoritada com sucesso",
            "favorites_count": tip.favorites_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao favoritar dica")
        return jsonify({"error": "Erro interno do servidor"}), 500