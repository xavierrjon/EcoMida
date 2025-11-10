from .user import db
from datetime import datetime

class Tip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    food_category = db.Column(db.String(50), nullable=False)
    created_by = db.Column(db.String(50), default='system')
    is_active = db.Column(db.Boolean, default=True)
    favorites_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "food_category": self.food_category,
            "created_by": self.created_by,
            "is_active": self.is_active,
            "favorites_count": self.favorites_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }