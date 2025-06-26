from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default="user")  # "admin" ou "user"
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)  # Campo para aprovação
    
    # Permissões específicas
    can_access_config = db.Column(db.Boolean, default=False)
    can_export = db.Column(db.Boolean, default=True)
    can_view_financial = db.Column(db.Boolean, default=True)
    can_view_analytics = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'is_active': self.is_active,
            'is_approved': self.is_approved,
            'permissions': {
                'can_access_config': self.can_access_config,
                'can_export': self.can_export,
                'can_view_financial': self.can_view_financial,
                'can_view_analytics': self.can_view_analytics
            }
        }

