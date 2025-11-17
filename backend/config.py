import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ecomida-super-secret-key-2024'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-super-secret-key-2024'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # SQLite database
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'ecomida.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações de notificação
    NOTIFICATION_DAYS_BEFORE = 3
    
    # Configurações de segurança
    BCRYPT_LOG_ROUNDS = 12