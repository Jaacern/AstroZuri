#!/bin/bash

# ============================================
# Script de Despliegue - AstroImpact VR
# VPS con Nginx, Debian 11 y Certbot
# ============================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Variables de configuración
DOMAIN_NAME="tu-dominio.com"  # Cambiar por tu dominio
APP_NAME="astroimpact"
APP_USER="astroimpact"
APP_DIR="/var/www/$APP_NAME"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SERVICE_NAME="astroimpact-backend"

log "Iniciando despliegue de AstroImpact VR..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
fi

# 1. Instalar dependencias del sistema
log "Instalando dependencias del sistema..."
sudo apt update
sudo apt install -y nginx nodejs npm certbot python3-certbot-nginx ufw

# 2. Crear usuario para la aplicación
log "Creando usuario de la aplicación..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -r -s /bin/false -d $APP_DIR $APP_USER
fi

# 3. Crear directorio de la aplicación
log "Creando directorio de la aplicación..."
sudo mkdir -p $APP_DIR
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# 4. Construir frontend
log "Construyendo frontend..."
cd frontend
npm install
npm run build
sudo cp -r build/* $APP_DIR/
cd ..

# 5. Instalar dependencias del backend
log "Instalando dependencias del backend..."
cd backend
npm install --production
sudo cp -r . $APP_DIR/backend/
cd ..

# 6. Crear archivo de configuración de entorno
log "Creando archivo de configuración..."
sudo tee $APP_DIR/backend/.env > /dev/null <<EOF
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://$DOMAIN_NAME
MONGODB_URI=mongodb://localhost:27017/astroimpact
JWT_SECRET=$(openssl rand -base64 32)
NASA_API_KEY=DEMO_KEY
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 7. Crear servicio systemd
log "Creando servicio systemd..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=AstroImpact Backend API
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 8. Configurar Nginx
log "Configurando Nginx..."
sudo tee $NGINX_SITES/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Configuración SSL (se completará con Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Servir archivos estáticos del frontend
    root $APP_DIR;
    index index.html;
    
    # Configuración para React Router
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy para API del backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Configuración para WebSocket (si se necesita en el futuro)
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Logs
    access_log /var/log/nginx/$APP_NAME.access.log;
    error_log /var/log/nginx/$APP_NAME.error.log;
}
EOF

# 9. Habilitar sitio en Nginx
log "Habilitando sitio en Nginx..."
sudo ln -sf $NGINX_SITES/$APP_NAME $NGINX_ENABLED/
sudo nginx -t || error "Error en configuración de Nginx"

# 10. Configurar firewall
log "Configurando firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable

# 11. Iniciar servicios
log "Iniciando servicios..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME
sudo systemctl reload nginx

# 12. Configurar SSL con Certbot
log "Configurando SSL con Certbot..."
info "IMPORTANTE: Asegúrate de que tu dominio apunte a este servidor antes de continuar."
read -p "¿Tu dominio $DOMAIN_NAME apunta a este servidor? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    sudo systemctl reload nginx
else
    warning "Saltando configuración SSL. Configúralo manualmente después con:"
    info "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
fi

# 13. Configurar renovación automática de SSL
log "Configurando renovación automática de SSL..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 14. Verificar estado de servicios
log "Verificando estado de servicios..."
sudo systemctl status $SERVICE_NAME --no-pager
sudo systemctl status nginx --no-pager

log "¡Despliegue completado exitosamente!"
info "Tu aplicación está disponible en: https://$DOMAIN_NAME"
info "Para ver logs del backend: sudo journalctl -u $SERVICE_NAME -f"
info "Para ver logs de Nginx: sudo tail -f /var/log/nginx/$APP_NAME.access.log"

