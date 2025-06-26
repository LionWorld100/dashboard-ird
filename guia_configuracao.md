# Guia de Configuração - Dashboard IRD

## Projeto Preparado

O projeto Dashboard IRD já está configurado localmente com:
- ✅ Repositório Git inicializado
- ✅ Arquivos commitados
- ✅ Backend Flask funcionando na porta 5000
- ✅ Estrutura de frontend e backend separadas
- ✅ Arquivos de configuração para deploy (Procfile, render.yaml, netlify.toml)

## Próximos Passos

### 1. Configuração do GitHub
- Criar repositório no GitHub
- Conectar repositório local ao GitHub
- Fazer push do código

### 2. Configuração do Render (Backend)
- Conectar repositório GitHub ao Render
- Configurar deploy do backend Flask
- Definir variáveis de ambiente

### 3. Configuração do Frontend
- Deploy do frontend (Netlify ou GitHub Pages)
- Configurar URL da API do backend

### 4. Testes Finais
- Verificar funcionamento completo
- Testar integração frontend-backend

## Localização do Projeto
Diretório: `/home/ubuntu/dashboard_ird_deploy/`

## Status Atual
- Backend rodando localmente ✅
- Git configurado ✅
- Aguardando configuração GitHub ⏳



## URL Pública Temporária
🌐 **Dashboard Online**: https://5000-ija1w9vx0qc1vpgzpryle-16f93313.manusvm.computer

Esta URL permite testar o dashboard funcionando online antes do deploy final.

## Comandos Git Preparados

Para conectar ao GitHub (execute após criar o repositório):

```bash
cd /home/ubuntu/dashboard_ird_deploy
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

## Estrutura de Arquivos Importantes

```
dashboard_ird_deploy/
├── dashboard_backend/
│   ├── src/main.py              # Aplicação Flask principal
│   ├── requirements.txt         # Dependências Python
│   ├── Procfile                # Configuração Render
│   └── render.yaml             # Configuração adicional Render
├── dashboard_frontend/
│   ├── index.html              # Página inicial
│   ├── login.html              # Página de login
│   ├── dashboard.html          # Dashboard principal
│   ├── js/config.js            # Configuração da API
│   └── netlify.toml            # Configuração Netlify
└── README.md                   # Documentação do projeto
```

