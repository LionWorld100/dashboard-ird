# Dashboard IRD - Documentação Completa

## Visão Geral

Este projeto é uma recriação completa do Dashboard IRD original, mantendo exatamente a mesma estética visual e funcionalidades. O sistema foi dividido em duas partes:

- **Backend Flask**: API REST para autenticação e dados do dashboard
- **Frontend Estático**: Interface web idêntica ao dashboard original

## Estrutura do Projeto

### Backend Flask (`/dashboard_backend/`)

```
dashboard_backend/
├── src/
│   ├── main.py                 # Aplicação principal Flask
│   ├── models/
│   │   └── user.py            # Modelo de usuário
│   ├── routes/
│   │   └── user.py            # Rotas de autenticação
│   ├── static/                # Arquivos estáticos (dashboard original)
│   │   ├── css/
│   │   ├── js/
│   │   ├── data/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── admin.html
│   │   └── index.html
│   └── database/
│       └── database.py        # Configuração do banco de dados
├── requirements.txt           # Dependências Python
├── Procfile                   # Configuração para deploy no Render
└── render.yaml               # Configuração adicional do Render
```

### Frontend Estático (`/dashboard_frontend/`)

```
dashboard_frontend/
├── css/
│   └── styles.css            # Estilos originais do dashboard
├── js/
│   ├── config.js             # Configuração da API
│   ├── auth.js               # Sistema de autenticação
│   ├── dashboard.js          # Lógica do dashboard
│   ├── charts.js             # Gráficos e visualizações
│   └── users.js              # Gerenciamento de usuários
├── data/
│   └── test_file.xlsx        # Arquivo de teste
├── dashboard.html            # Dashboard principal
├── login.html                # Página de login
├── admin.html                # Painel administrativo
├── index.html                # Página inicial
├── favicon.ico               # Ícone do site
└── netlify.toml              # Configuração para deploy no Netlify
```

## Funcionalidades Implementadas

### Backend (Flask)

1. **Sistema de Autenticação**
   - Login de usuários
   - Registro de novos usuários
   - Gerenciamento de sessões
   - Alteração de senhas

2. **API de Dados**
   - Endpoint para dados do dashboard
   - Dados simulados para gráficos e métricas
   - CORS habilitado para integração com frontend

3. **Gerenciamento de Usuários**
   - CRUD completo de usuários
   - Sistema de aprovação de usuários pendentes
   - Controle de acesso administrativo

### Frontend (Estático)

1. **Interface Idêntica ao Original**
   - Mesma estética visual
   - Mesmos comandos e funcionalidades
   - Layout responsivo preservado

2. **Dashboard Interativo**
   - Gráficos dinâmicos com Chart.js
   - Métricas em tempo real
   - Filtros e visualizações

3. **Sistema de Autenticação**
   - Formulários de login e registro
   - Gerenciamento de sessão local
   - Redirecionamentos automáticos

## Configuração para Deploy

### Backend no Render

1. **Arquivos de Configuração**:
   - `Procfile`: Define o comando de inicialização
   - `render.yaml`: Configurações específicas do Render
   - `requirements.txt`: Dependências Python

2. **Variáveis de Ambiente**:
   - `FLASK_ENV=production`
   - `PORT=5000`

3. **Comando de Deploy**:
   ```bash
   pip install -r requirements.txt
   cd src && python main.py
   ```

### Frontend no Netlify

1. **Arquivos de Configuração**:
   - `netlify.toml`: Configurações de deploy e headers de segurança

2. **Configurações**:
   - Deploy direto dos arquivos estáticos
   - Headers de segurança configurados
   - Cache otimizado para CSS/JS

## Como Usar

### Desenvolvimento Local

1. **Backend**:
   ```bash
   cd dashboard_backend
   source venv/bin/activate
   pip install -r requirements.txt
   python src/main.py
   ```

2. **Frontend**:
   ```bash
   cd dashboard_frontend
   python3 -m http.server 8000
   ```

### Deploy em Produção

1. **Backend (Render)**:
   - Conectar repositório Git ao Render
   - Configurar como Web Service
   - Definir diretório raiz como `dashboard_backend`
   - Deploy automático

2. **Frontend (Netlify)**:
   - Conectar repositório Git ao Netlify
   - Configurar diretório de publicação como `dashboard_frontend`
   - Deploy automático

## Tecnologias Utilizadas

### Backend
- **Flask**: Framework web Python
- **SQLAlchemy**: ORM para banco de dados
- **Flask-CORS**: Habilitação de CORS
- **Werkzeug**: Utilitários web

### Frontend
- **HTML5/CSS3**: Estrutura e estilização
- **JavaScript ES6+**: Lógica da aplicação
- **Chart.js**: Gráficos e visualizações
- **Font Awesome**: Ícones
- **Google Fonts**: Tipografia

## Segurança

1. **Headers de Segurança**:
   - X-Frame-Options
   - X-XSS-Protection
   - Content-Security-Policy
   - X-Content-Type-Options

2. **Autenticação**:
   - Senhas hasheadas
   - Sessões seguras
   - Validação de entrada

3. **CORS**:
   - Configurado para permitir apenas origens específicas
   - Headers apropriados para API

## Manutenção

### Atualizações
- Backend: Atualizar dependências no `requirements.txt`
- Frontend: Atualizar bibliotecas CDN conforme necessário

### Monitoramento
- Logs do Flask para debugging
- Console do navegador para erros frontend

### Backup
- Banco de dados SQLite incluído no repositório
- Arquivos estáticos versionados no Git

## Suporte

Para questões técnicas ou problemas:
1. Verificar logs do servidor
2. Testar localmente primeiro
3. Verificar configurações de CORS
4. Validar URLs da API

## Conclusão

Este projeto mantém 100% da funcionalidade e aparência do dashboard original, com a vantagem de estar preparado para deploy moderno em plataformas cloud como Render e Netlify.

