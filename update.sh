#!/bin/bash

# ============================================
# Script de Actualización - AstroImpact VR
# Para actualizar la aplicación en producción
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Variables
APP_NAME="astroimpact"
APP_DIR="/var/www/$APP_NAME"
SERVICE_NAME="astroimpact-backend"

log "Iniciando actualización de AstroImpact VR..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
fi

# 1. Crear backup
log "Creando backup de la aplicación actual..."
sudo tar -czf "/tmp/astroimpact-backup-$(date +%Y%m%d-%H%M%S).tar.gz" $APP_DIR

# 2. Detener servicios
log "Deteniendo servicios..."
sudo systemctl stop $SERVICE_NAME

# 3. Actualizar frontend
log "Actualizando frontend..."
cd frontend
npm install
npm run build
sudo rm -rf $APP_DIR/*
sudo cp -r build/* $APP_DIR/
cd ..

# 4. Actualizar backend
log "Actualizando backend..."
cd backend
npm install --production
sudo rm -rf $APP_DIR/backend/*
sudo cp -r . $APP_DIR/backend/
cd ..

# 5. Restaurar archivo .env
log "Restaurando configuración..."
if [ -f "$APP_DIR/backend/.env" ]; then
    sudo cp $APP_DIR/backend/.env /tmp/astroimpact-env-backup
    sudo cp /tmp/astroimpact-env-backup $APP_DIR/backend/.env
fi

# 6. Corregir permisos
log "Corrigiendo permisos..."
sudo chown -R astroimpact:astroimpact $APP_DIR
sudo chmod -R 755 $APP_DIR

# 7. Reiniciar servicios
log "Reiniciando servicios..."
sudo systemctl start $SERVICE_NAME
sudo systemctl reload nginx

# 8. Verificar estado
log "Verificando estado de servicios..."
sleep 5
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    log "✅ Backend iniciado correctamente"
else
    error "❌ Error al iniciar el backend"
fi

if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx funcionando correctamente"
else
    error "❌ Error con Nginx"
fi

log "🎉 Actualización completada exitosamente!"
log "📊 Para ver logs: sudo journalctl -u $SERVICE_NAME -f"

