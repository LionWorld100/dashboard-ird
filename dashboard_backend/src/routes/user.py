from flask import Blueprint, request, jsonify
from src.models.user import User, db

user_bp = Blueprint('auth', __name__)

@user_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')  # Default para 'user'

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'User already exists'}), 409

    # Se não houver usuários, o primeiro será admin e aprovado automaticamente
    user_count = User.query.count()
    if user_count == 0:
        role = 'admin'
        can_access_config = True
        is_approved = True
    else:
        can_access_config = False
        is_approved = False  # Novos usuários precisam de aprovação

    new_user = User(
        username=username, 
        role=role,
        can_access_config=can_access_config,
        is_approved=is_approved
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    if is_approved:
        return jsonify({'message': 'Usuário registrado com sucesso!', 'role': role}), 201
    else:
        return jsonify({'message': 'Usuário registrado com sucesso! Aguarde a aprovação de um administrador.', 'pending_approval': True}), 201

@user_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'message': 'Account is deactivated'}), 403
        
    if not user.is_approved:
        return jsonify({'message': 'Sua conta ainda não foi aprovada por um administrador. Aguarde a aprovação.'}), 403

    return jsonify({
        'message': 'Login successful', 
        'username': user.username,
        'role': user.role,
        'permissions': {
            'can_access_config': user.can_access_config,
            'can_export': user.can_export,
            'can_view_financial': user.can_view_financial,
            'can_view_analytics': user.can_view_analytics
        }
    }), 200

@user_bp.route('/auth/users', methods=['GET'])
def get_users():
    users = User.query.all()
    users_list = [user.to_dict() for user in users]
    return jsonify({'users': users_list}), 200

@user_bp.route('/auth/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Atualizar campos se fornecidos
    if 'role' in data:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'is_approved' in data:
        user.is_approved = data['is_approved']
    if 'can_access_config' in data:
        user.can_access_config = data['can_access_config']
    if 'can_export' in data:
        user.can_export = data['can_export']
    if 'can_view_financial' in data:
        user.can_view_financial = data['can_view_financial']
    if 'can_view_analytics' in data:
        user.can_view_analytics = data['can_view_analytics']
    
    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@user_bp.route('/auth/users/<int:user_id>/approve', methods=['POST'])
def approve_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    user.is_approved = True
    db.session.commit()
    return jsonify({'message': 'User approved successfully'}), 200

@user_bp.route('/auth/users/pending', methods=['GET'])
def get_pending_users():
    pending_users = User.query.filter_by(is_approved=False).all()
    users_list = [user.to_dict() for user in pending_users]
    return jsonify({'pending_users': users_list}), 200

@user_bp.route('/auth/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Não permitir deletar o último admin
    if user.role == 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({'message': 'Cannot delete the last admin user'}), 400
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

@user_bp.route('/auth/change_password', methods=['POST'])
def change_password():
    data = request.get_json()
    username = data.get('username')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not username or not old_password or not new_password:
        return jsonify({'message': 'Username, old password, and new password are required'}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(old_password):
        return jsonify({'message': 'Invalid credentials'}), 401

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200

@user_bp.route('/dashboard/data', methods=['GET'])
def get_dashboard_data():
    """Endpoint para fornecer dados do dashboard"""
    # Dados de exemplo - substitua pelos seus dados reais
    dashboard_data = {
        "cards": [
            {"title": "Total de Vendas", "value": "R$ 125.430", "change": "+12%", "type": "success"},
            {"title": "Novos Clientes", "value": "1.234", "change": "+5%", "type": "info"},
            {"title": "Pedidos", "value": "856", "change": "-2%", "type": "warning"},
            {"title": "Receita Mensal", "value": "R$ 45.678", "change": "+8%", "type": "success"}
        ],
        "charts": {
            "sales": {
                "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                "data": [12000, 19000, 15000, 25000, 22000, 30000]
            },
            "customers": {
                "labels": ["Novos", "Recorrentes", "Inativos"],
                "data": [45, 35, 20]
            }
        },
        "recent_activities": [
            {"action": "Nova venda realizada", "time": "há 2 minutos", "type": "success"},
            {"action": "Cliente cadastrado", "time": "há 15 minutos", "type": "info"},
            {"action": "Pedido cancelado", "time": "há 1 hora", "type": "warning"}
        ]
    }
    
    return jsonify(dashboard_data), 200

