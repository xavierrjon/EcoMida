from .user import db
from datetime import datetime

class History(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(20), nullable=False)  
    food_name = db.Column(db.String(100), nullable=False)
    details = db.Column(db.JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "food_id": self.food_id,
            "action": self.action,
            "food_name": self.food_name,
            "details": self.details,
            "created_at": self.created_at.isoformat()
        }