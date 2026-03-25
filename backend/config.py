import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def _parse_origins(value):
    if not value:
        return []
    return [origin.strip() for origin in value.split(',') if origin.strip()]

class Config:
    APP_ENV = os.environ.get('APP_ENV', 'development').lower()
    DEBUG = APP_ENV == 'development'

    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

    if not SECRET_KEY or not JWT_SECRET_KEY:
        raise RuntimeError(
            'SECRET_KEY e JWT_SECRET_KEY devem ser definidos em variaveis de ambiente.'
        )

    _default_dev_origins = [
        'http://localhost:5000',
        'http://localhost:8080',
        'https://*.ngrok.io',
        'http://*.ngrok.io'
    ]
    CORS_ALLOWED_ORIGINS = _parse_origins(os.environ.get('CORS_ALLOWED_ORIGINS'))
    if APP_ENV == 'production' and not CORS_ALLOWED_ORIGINS:
        raise RuntimeError(
            'CORS_ALLOWED_ORIGINS deve ser definido em producao.'
        )
    if not CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS = _default_dev_origins

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'ecomida.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    NOTIFICATION_DAYS_BEFORE = 3
    
    BCRYPT_LOG_ROUNDS = 12  