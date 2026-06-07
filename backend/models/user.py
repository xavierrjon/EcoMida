from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    notification_settings = db.Column(db.JSON, default={
        "enabled": True,
        "days_before": 3,
        "push_notifications": True,
        "email_notifications": False,
        "alert_sound": True,
        "quiet_hours": {
            "enabled": False,
            "start": "22:00",
            "end": "08:00"
        }
    })
    
    accessibility_settings = db.Column(db.JSON, default={
        "voice_reading": False
    })
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    foods = db.relationship('Food', backref='user', lazy=True)
    histories = db.relationship('History', backref='user', lazy=True)
    # Relacionamento com dicas favoritadas através de UserTipFavorite
    favorite_tips = db.relationship('UserTipFavorite', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "notification_settings": self.notification_settings, 
            "accessibility_settings": self.accessibility_settings, 
            "created_at": self.created_at.isoformat(),            
            "updated_at": self.updated_at.isoformat()           
        }
    
    def __repr__(self):
        return f'<User {self.username}>'