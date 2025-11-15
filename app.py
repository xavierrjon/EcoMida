from flask import Flask, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models.user import db, User
from models.food import Food
from models.tip import Tip
from models.history import History
from routes.auth import auth_bp
from routes.foods import foods_bp
from routes.tips import tips_bp
from routes.notifications import notifications_bp
import traceback

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Inicializar extensões
    db.init_app(app)
    CORS(app)
    bcrypt = Bcrypt(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    
    # Registrar blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(foods_bp, url_prefix='/api')
    app.register_blueprint(tips_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api')
    
    # Criar tabelas
    with app.app_context():
        db.create_all()
        print("✅ Tabelas do banco criadas com sucesso!")
        
        # Adicionar dicas padrão se não existirem
        if Tip.query.count() == 0:
            default_tips = [
                Tip(
                    title="Armazenamento de Laticínios",
                    content="Armazene queijos em embalagens herméticas na parte mais fria da geladeira. Leite deve ser mantido sempre refrigerado.",
                    food_category="laticinios"
                ),
                Tip(
                    title="Conservação de Frutas",
                    content="Mantenha frutas em local fresco e arejado. Bananas devem ser armazenadas separadas de outras frutas.",
                    food_category="frutas"
                ),
                Tip(
                    title="Armazenamento de Grãos",
                    content="Grãos devem ser armazenados em recipientes herméticos em local seco e escuro.",
                    food_category="graos"
                )
            ]
            db.session.bulk_save_objects(default_tips)
            db.session.commit()
            print("✅ Dicas padrão adicionadas!")
    
    # Rota de saúde
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "EcoMida API está rodando"})
    
    # Manipulador de erro global
    @app.errorhandler(500)
    def internal_error(error):
        error_traceback = traceback.format_exc()
        print("❌ ERRO 500 DETALHADO:")
        print(error_traceback)
        return jsonify({"error": "Erro interno do servidor"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 EcoMida Backend com SQLite iniciando...")
    print("📝 API disponível em http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/api/health")
    
    app.run(debug=True, host='0.0.0.0', port=5000)