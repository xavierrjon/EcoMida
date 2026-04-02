from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import db, User
from models.tip import Tip
from models.favorites import UserTipFavorite
from utils.auth import get_user_from_jwt_identity
import logging

logger = logging.getLogger(__name__)

tips_bp = Blueprint('tips', __name__)

@tips_bp.route('/tips', methods=['GET'])
def get_tips():
    """
    Retorna todas as dicas ativas, com indicador de favorito se usuário autenticado.
    """
    try:
        category = request.args.get('category')
        current_user = None
        
        # Verificar se há token JWT (usuário autenticado)
        try:
            current_identity = get_jwt_identity()
            current_user = get_user_from_jwt_identity(current_identity)
        except:
            # Sem autenticação, continua sem usuário
            pass
        
        query = Tip.query.filter_by(is_active=True)
        if category:
            query = query.filter_by(food_category=category)
        
        tips = query.all()
        
        # Construir lista de dicas com indicador de favorito
        tips_data = []
        for tip in tips:
            tip_dict = tip.to_dict()
            # Verificar se o usuário atual favoritou esta dica
            tip_dict['is_favorite'] = False
            if current_user:
                favorite = UserTipFavorite.query.filter_by(
                    user_id=current_user.id,
                    tip_id=tip.id
                ).first()
                tip_dict['is_favorite'] = favorite is not None
            tips_data.append(tip_dict)
        
        return jsonify({
            "tips": tips_data
        }), 200
        
    except Exception as e:
        logger.exception("Erro ao buscar dicas")
        return jsonify({"error": "Erro interno do servidor"}), 500

@tips_bp.route('/tips/<int:tip_id>/favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(tip_id):
    """
    Toggle de favorito para uma dica (idempotente).
    - Se não favoritada: adiciona à UserTipFavorite
    - Se favoritada: remove de UserTipFavorite
    """
    try:
        current_identity = get_jwt_identity()
        user = get_user_from_jwt_identity(current_identity)
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Verificar se a dica existe
        tip = Tip.query.get(tip_id)
        if not tip:
            return jsonify({"error": "Dica não encontrada"}), 404

        # Verificar se já é favorito
        existing_favorite = UserTipFavorite.query.filter_by(
            user_id=user.id,
            tip_id=tip_id
        ).first()

        if existing_favorite:
            # Já está favoritado, remover
            db.session.delete(existing_favorite)
            is_favorite = False
            message = "Dica removida dos favoritos"
        else:
            # Não está favoritado, adicionar
            new_favorite = UserTipFavorite(user_id=user.id, tip_id=tip_id)
            db.session.add(new_favorite)
            is_favorite = True
            message = "Dica adicionada aos favoritos"

        db.session.commit()

        return jsonify({
            "message": message,
            "is_favorite": is_favorite,
            "tip_id": tip_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao favoritar dica")
        return jsonify({"error": "Erro interno do servidor"}), 500