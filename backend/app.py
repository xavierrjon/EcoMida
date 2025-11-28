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
    
    @app.after_request
    def after_request(response):
        response.headers.add('ngrok-skip-browser-warning', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'ngrok-skip-browser-warning')
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(foods_bp, url_prefix='/api')
    app.register_blueprint(tips_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    @app.route('/')
    def serve_frontend():
        return send_from_directory('../frontend', 'index.html')
    
    @app.route('/<path:filename>')
    def serve_static(filename):
        frontend_path = os.path.join(os.path.dirname(__file__), '../frontend')
        file_path = os.path.join(frontend_path, filename)
        
        if os.path.exists(file_path):
            return send_from_directory('../frontend', filename)
        else:
            return send_from_directory('../frontend', 'index.html')
    
    @app.route('/images/<path:filename>')
    def serve_images(filename):
        return send_from_directory('../frontend/images', filename)
    
    with app.app_context():
        db.create_all()
        print("✅ Tabelas do banco criadas com sucesso!")
        
        if Tip.query.count() == 0:
            default_tips = [
            
                Tip(
                    title="Armazenamento de Queijos",
                    content="Queijos devem ser armazenados em embalagens herméticas na parte mais fria da geladeira. Para queijos mais macios, use papel manteiga antes de vedar.",
                    food_category="laticinios"
                ),
                Tip(
                    title="Conservação do Leite",
                    content="Mantenha o leite sempre na geladeira, nunca na porta. A temperatura ideal é entre 1°C e 4°C. Após aberto, consuma em até 3 dias.",
                    food_category="laticinios"
                ),
                Tip(
                    title="Iogurtes e Fermentados",
                    content="Armazene iogurtes na parte média da geladeira. Mantenha sempre fechados e consuma antes do vencimento para manter as culturas probióticas ativas.",
                    food_category="laticinios"
                ),
                
                Tip(
                    title="Amadurecimento de Frutas",
                    content="Para acelerar o amadurecimento, guarde frutas em sacos de papel em temperatura ambiente. Bananas liberam etileno e amadurecem outras frutas próximas.",
                    food_category="frutas"
                ),
                Tip(
                    title="Frutas Cítricas",
                    content="Laranjas, limões e tangerinas duram mais na geladeira. Guarde na gaveta de vegetais para evitar ressecamento.",
                    food_category="frutas"
                ),
                Tip(
                    title="Frutas Vermelhas",
                    content="Morangos, framboesas e amoras são muito sensíveis. Lave apenas antes de consumir e guarde na geladeira em recipiente ventilado.",
                    food_category="frutas"
                ),
                Tip(
                    title="Bananas e Maçãs",
                    content="Armazene bananas separadas de outras frutas. Maçãs podem ser guardadas na geladeira por até 1 mês.",
                    food_category="frutas"
                ),
                
                Tip(
                    title="Folhas Verdes",
                    content="Alface, rúcula e espinafre devem ser lavados, secos e armazenados em sacos plásticos com papel toalha na geladeira.",
                    food_category="verduras"
                ),
                Tip(
                    title="Temperos e Ervas",
                    content="Salsinha, cebolinha e coentro duram mais com os talos em água, como um buquê, na geladeira.",
                    food_category="verduras"
                ),
                Tip(
                    title="Legumes de Raiz",
                    content="Cenouras, beterrabas e rabanetes devem ser guardados na geladeira sem as folhas, que roubam nutrientes.",
                    food_category="verduras"
                ),
                
                Tip(
                    title="Carnes Frescas",
                    content="Armazene carnes na parte mais fria da geladeira, em recipientes que evitem vazamento de líquidos. Consuma em até 2 dias.",
                    food_category="carnes"
                ),
                Tip(
                    title="Congelamento de Carnes",
                    content="Para congelar, divida em porções, embale a vácuo ou use potes herméticos. Marque a data de congelamento.",
                    food_category="carnes"
                ),
                Tip(
                    title="Descongelamento Seguro",
                    content="Descongele carnes na geladeira, nunca em temperatura ambiente. Para urgência, use o micro-ondas no modo descongelar.",
                    food_category="carnes"
                ),
                
                Tip(
                    title="Armazenamento de Arroz",
                    content="Armazene arroz em recipientes herméticos em local seco e escuro. Adicione folhas de louro para afastar insetos.",
                    food_category="graos"
                ),
                Tip(
                    title="Feijões e Lentilhas",
                    content="Mantenha feijões em potes fechados. Para cozimento mais rápido, deixe de molho por 8-12 horas antes de cozinhar.",
                    food_category="graos"
                ),
                Tip(
                    title="Farinhas e Cereais",
                    content="Farinha de trigo e outros cereais devem ser armazenados em locais frescos e secos. Verifique periodicamente por insetos.",
                    food_category="graos"
                ),
                
                Tip(
                    title="Sucos Naturais",
                    content="Sucos feitos em casa devem ser consumidos em até 24 horas. Guarde em garrafas escuras na geladeira.",
                    food_category="bebidas"
                ),
                Tip(
                    title="Vinhos e Bebidas Alcoólicas",
                    content="Vinhos tintos em local fresco e escuro, brancos na geladeira. Bebidas destiladas em pé, para não corroer as rolhas.",
                    food_category="bebidas"
                ),
                Tip(
                    title="Refrigerantes e Águas",
                    content="Mantenha em local fresco, longe da luz solar. Após abertos, consuma rapidamente para manter o gás.",
                    food_category="bebidas"
                ),
                
                Tip(
                    title="Ovos Frescos",
                    content="Armazene ovos na geladeira na embalagem original. Não lave antes de guardar, isso remove a proteção natural.",
                    food_category="outros"
                ),
                Tip(
                    title="Pães e Massas",
                    content="Pães caseiros em temperatura ambiente por 2-3 dias, depois congele. Massas secas em local seco por até 1 ano.",
                    food_category="outros"
                ),
                Tip(
                    title="Enlatados e Conservas",
                    content="Após abertos, transfira para potes de vidro e guarde na geladeira. Consuma em até 3 dias.",
                    food_category="outros"
                )
            ]
            
            db.session.bulk_save_objects(default_tips)
            db.session.commit()
            print(f"✅ {len(default_tips)} dicas padrão adicionadas!")
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "message": "EcoMida API está rodando",
            "environment": "development",
            "cors": "enabled"
        })
    
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
        return send_from_directory('../frontend', 'index.html')
    
    @app.errorhandler(500)
    def internal_error(error):
        error_traceback = traceback.format_exc()
        print("❌ ERRO 500 DETALHADO:")
        print(error_traceback)
        return jsonify({"error": "Erro interno do servidor"}), 500
    
    return app

    @app.route('/sw-notifications.js')
    def serve_sw_notifications():
        return send_from_directory('../frontend', 'sw-notifications.js')

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