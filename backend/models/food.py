from datetime import datetime, date
from .user import db

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
        """Verifica se o alimento já venceu (baseado em data UTC)"""
        return datetime.utcnow().date() > self.expiry_date
    
    @property
    def days_until_expiry(self):
        """
        Retorna dias exatos até a validade.
        Negativo se vencido, 0 se vence hoje, positivo se vence no futuro.
        Usa data local do servidor para cálculo preciso.
        """
        today = date.today()  # Data local do servidor
        
        # Garantir que expiry_date é date, não datetime
        if isinstance(self.expiry_date, datetime):
            expiry = self.expiry_date.date()
        else:
            expiry = self.expiry_date
        
        return (expiry - today).days
    
    @property
    def expiry_status(self):
        """
        Retorna objeto com status padronizado para frontend.
        Isso garante consistência em toda a aplicação.
        """
        days = self.days_until_expiry
        
        if days < 0:
            return {
                'type': 'expired',
                'days': abs(days),
                'message': f'Vencido há {abs(days)} dias',
                'priority': 1  # Para ordenação
            }
        elif days == 0:
            return {
                'type': 'today',
                'days': 0,
                'message': 'Vence hoje!',
                'priority': 2
            }
        elif days == 1:
            return {
                'type': 'tomorrow',
                'days': 1,
                'message': 'Vence amanhã',
                'priority': 3
            }
        elif days == 2:
            return {
                'type': 'in_2_days',
                'days': 2,
                'message': 'Vence depois de amanhã',
                'priority': 4
            }
        elif days <= 7:
            return {
                'type': 'in_x_days',
                'days': days,
                'message': f'Vence em {days} dias',
                'priority': 5
            }
        else:
            return {
                'type': 'future',
                'days': days,
                'message': f'Vence em {days} dias',
                'priority': 6
            }
    
    @property
    def expiry_message(self):
        """Atalho para a mensagem do status"""
        return self.expiry_status['message']
    
    @property
    def expiry_priority(self):
        """Para ordenação: vencidos primeiro, depois próximos"""
        days = self.days_until_expiry
        
        if days < 0:
            return days  # Vencidos: mais negativo = mais antigo
        else:
            # Futuros: menor número = mais próximo
            # Garantir que futuros vêm depois de vencidos
            return days + 1000
    
    @property
    def expiry_date_display(self):
        """Data formatada no padrão brasileiro (DD/MM/YYYY)"""
        if not self.expiry_date:
            return None
            
        # Garantir que é date, não datetime
        if isinstance(self.expiry_date, datetime):
            expiry_date_obj = self.expiry_date.date()
        else:
            expiry_date_obj = self.expiry_date
        
        # Formatar DD/MM/YYYY manualmente
        day = expiry_date_obj.day
        month = expiry_date_obj.month
        year = expiry_date_obj.year
        return f"{day:02d}/{month:02d}/{year}"
    
    def to_dict(self):
        """Serialização completa com todos os campos de validade"""
        # Garantir que expiry_date é date para formatação
        if self.expiry_date:
            if isinstance(self.expiry_date, datetime):
                expiry_date_obj = self.expiry_date.date()
                expiry_date_iso = expiry_date_obj.isoformat()
            else:
                expiry_date_obj = self.expiry_date
                expiry_date_iso = expiry_date_obj.isoformat()
        else:
            expiry_date_obj = None
            expiry_date_iso = None
        
        return {
            "id": self.id,
            "name": self.name,
            "expiry_date": expiry_date_iso,                # ISO para cálculos
            "expiry_date_display": self.expiry_date_display,  # BR para exibição
            "quantity": self.quantity,
            "unit": self.unit,  
            "food_type": self.food_type,
            "user_id": self.user_id,
            "status": self.status,
            "is_expired": self.is_expired,
            "days_until_expiry": self.days_until_expiry,
            "expiry_status": self.expiry_status,          # Objeto completo
            "expiry_message": self.expiry_message,        # Mensagem pronta
            "expiry_priority": self.expiry_priority,      # Para ordenação
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f"<Food {self.id}: {self.name} (Vence: {self.expiry_date_display})>"