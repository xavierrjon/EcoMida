from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import db, User
from models.tip import Tip
import traceback

tips_bp = Blueprint('tips', __name__)

@tips_bp.route('/tips', methods=['GET'])
@jwt_required()
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
        print(f"❌ Erro ao buscar dicas: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@tips_bp.route('/tips/<int:tip_id>/favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(tip_id):
    try:
        print(f"🔍 Tentando favoritar dica ID: {tip_id}")
        
        current_user_email = get_jwt_identity()
        
        user = User.query.filter_by(email=current_user_email).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Verificar se a dica existe
        tip = Tip.query.get(tip_id)
        if not tip:
            print(f"❌ Dica com ID {tip_id} não encontrada")
            return jsonify({"error": "Dica não encontrada"}), 404
        
        print(f"✅ Dica encontrada: {tip.title}")
        
        # Incrementar contador de favoritos
        tip.favorites_count += 1
        db.session.commit()
        
        print(f"✅ Dica favoritada com sucesso. Novo count: {tip.favorites_count}")
        
        return jsonify({
            "message": "Dica favoritada com sucesso",
            "favorites_count": tip.favorites_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao favoritar dica: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500