from flask import Flask, jsonify, send_from_directory, request
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
import os

def create_app():
    app = Flask(__name__, 
                static_folder='../frontend',
                template_folder='../frontend')
    app.config.from_object(Config)
    
    # ✅ CORS CONFIGURADO PARA NGROK
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5000",
                "http://localhost:8080", 
                "https://*.ngrok.io",
                "http://*.ngrok.io",
                "*"  # Para desenvolvimento
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
        }
    })
    
    db.init_app(app)
    bcrypt = Bcrypt(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    
    # ✅ MIDDLEWARE PARA NGROK - DEVE VIR DEPOIS DO CORS
    @app.after_request
    def after_request(response):
        response.headers.add('ngrok-skip-browser-warning', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'ngrok-skip-browser-warning')
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(foods_bp, url_prefix='/api')
    app.register_blueprint(tips_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api')
    
    # ✅ ROTAS PARA ARQUIVOS ESTÁTICOS
    @app.route('/')
    def serve_frontend():
        return send_from_directory('../frontend', 'index.html')
    
    @app.route('/<path:filename>')
    def serve_static(filename):
        # Verifica se o arquivo existe
        frontend_path = os.path.join(os.path.dirname(__file__), '../frontend')
        file_path = os.path.join(frontend_path, filename)
        
        if os.path.exists(file_path):
            return send_from_directory('../frontend', filename)
        else:
            # Para SPA - redireciona rotas não encontradas para o index.html
            return send_from_directory('../frontend', 'index.html')
    
    # ✅ ROTA ESPECÍFICA PARA IMAGENS
    @app.route('/images/<path:filename>')
    def serve_images(filename):
        return send_from_directory('../frontend/images', filename)
    
    with app.app_context():
        db.create_all()
        print("✅ Tabelas do banco criadas com sucesso!")
        
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
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "message": "EcoMida API está rodando",
            "environment": "development",
            "cors": "enabled"
        })
    
    # ✅ ROTA PARA TESTE DE CORS
    @app.route('/api/test-cors', methods=['GET', 'POST', 'OPTIONS'])
    def test_cors():
        if request.method == 'OPTIONS':
            return jsonify({"status": "cors_preflight"})
        return jsonify({
            "status": "success",
            "message": "CORS está funcionando",
            "origin": request.headers.get('Origin'),
            "headers": dict(request.headers)
        })
    
    @app.errorhandler(404)
    def not_found(error):
        # Para SPA - redireciona todas as rotas não encontradas para o index.html
        return send_from_directory('../frontend', 'index.html')
    
    @app.errorhandler(500)
    def internal_error(error):
        error_traceback = traceback.format_exc()
        print("❌ ERRO 500 DETALHADO:")
        print(error_traceback)
        return jsonify({"error": "Erro interno do servidor"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 EcoMida Full-Stack com Ngrok iniciando...")
    print("📱 App disponível em: http://localhost:5000")
    print("🌐 Ngrok URL: https://SEU-SUBDOMINIO.ngrok.io")
    print("🔧 API disponível em: http://localhost:5000/api")
    print("🔍 Health check: http://localhost:5000/api/health")
    print("🔍 Teste CORS: http://localhost:5000/api/test-cors")
    print("")
    print("⚠️  Para usar com Ngrok:")
    print("1. Rode: ngrok http 5000")
    print("2. Acesse a URL do Ngrok no celular")
    print("")
    
    app.run(debug=True, host='0.0.0.0', port=5000)