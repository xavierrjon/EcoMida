from datetime import datetime, timedelta
from models.food import Food

class NotificationSystem:
    def __init__(self, db):
        self.db = db
    
    def check_expiring_foods(self):
        """Verifica alimentos que estão próximos do vencimento"""
        today = datetime.utcnow()
        threshold_date = today + timedelta(days=3)  # 3 dias de antecedência
        
        foods_collection = self.db.foods
        expiring_foods = []
        
        # Encontrar alimentos que expiram em até 3 dias e estão ativos
        foods = foods_collection.find({
            "expiry_date": {"$lte": threshold_date, "$gte": today},
            "status": "active"
        })
        
        for food in foods:
            days_until = (food['expiry_date'] - today).days
            expiring_foods.append({
                'food_id': str(food['_id']),
                'name': food['name'],
                'expiry_date': food['expiry_date'],
                'days_until': days_until,
                'user_id': food['user_id']
            })
        
        return expiring_foods
    
    def get_notifications_for_user(self, user_id):
        """Obtém notificações para um usuário específico"""
        expiring_foods = self.check_expiring_foods()
        user_notifications = [
            food for food in expiring_foods if food['user_id'] == user_id
        ]
        
        return user_notifications