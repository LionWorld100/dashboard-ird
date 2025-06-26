// Configuração da API
const API_BASE_URL = 'https://dashboard-backend-production.up.railway.app/api';

// URLs dos endpoints
const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    USERS: `${API_BASE_URL}/auth/users`,
    USERS_PENDING: `${API_BASE_URL}/auth/users/pending`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change_password`,
    DASHBOARD_DATA: `${API_BASE_URL}/dashboard/data`
};

// Função para fazer requisições à API
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        return response;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

