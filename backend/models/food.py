from .user import db
from datetime import datetime

class Food(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Float, default=1.0) 
    unit = db.Column(db.String(20), default='unidades')  
    food_type = db.Column(db.String(50), default='outros')
    status = db.Column(db.String(20), default='active')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_expired(self):
        return datetime.utcnow().date() > self.expiry_date
    
    @property
    def days_until_expiry(self):
        today = datetime.utcnow().date()
        delta = self.expiry_date - today
        return delta.days
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "expiry_date": self.expiry_date.isoformat(),
            "quantity": self.quantity,
            "unit": self.unit,  
            "food_type": self.food_type,
            "user_id": self.user_id,
            "status": self.status,
            "is_expired": self.is_expired,
            "days_until_expiry": self.days_until_expiry,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }