from .user import db
from datetime import datetime

class UserTipFavorite(db.Model):
    """
    Tabela de associação entre usuários e dicas favoritadas.
    Armazena qual usuário favoritou qual dica.
    """
    __tablename__ = 'user_tip_favorite'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tip_id = db.Column(db.Integer, db.ForeignKey('tip.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Constraint: não permitir duplicatas (cada usuário favorita uma dica apenas 1 vez)
    __table_args__ = (db.UniqueConstraint('user_id', 'tip_id', name='unique_user_tip_favorite'),)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "tip_id": self.tip_id,
            "created_at": self.created_at.isoformat()
        }
