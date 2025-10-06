#!/bin/bash

# Script para desplegar AstroZuri en VPS
# Dominio: astrozuri.javiercerna.dev
# Ruta: /var/www/astrozuri

echo "🚀 Iniciando despliegue de AstroZuri..."

# Variables
VPS_HOST="tu-vps-ip"
VPS_USER="tu-usuario"
DOMAIN="astrozuri.javiercerna.dev"
REMOTE_PATH="/var/www/astrozuri"

echo "📦 Preparando archivos para despliegue..."

# Crear directorio temporal
TEMP_DIR="/tmp/astrozuri-deploy"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copiar frontend build
echo "📁 Copiando frontend..."
cp -r frontend/build/* $TEMP_DIR/

# Copiar backend
echo "📁 Copiando backend..."
cp -r backend $TEMP_DIR/backend

# Crear archivos de configuración
echo "⚙️  Creando archivos de configuración..."

# Crear package.json para el backend en producción
cat > $TEMP_DIR/backend/package.prod.json << EOF
{
  "name": "astrozuri-backend",
  "version": "1.0.0",
  "description": "AstroZuri Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "pm2": "pm2 start ecosystem.config.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.5.0"
  }
}
EOF

# Crear ecosystem.config.js para PM2
cat > $TEMP_DIR/backend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'astrozuri-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/astrozuri',
      JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
      NASA_API_KEY: process.env.NASA_API_KEY || ''
    }
  }]
};
EOF

# Crear archivo de configuración de Nginx
cat > $TEMP_DIR/nginx.conf << EOF
server {
    listen 80;
    server_name astrozuri.javiercerna.dev;
    root /var/www/astrozuri;
    index index.html;

    # Frontend - servir archivos estáticos
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Archivos estáticos
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Crear script de instalación para el VPS
cat > $TEMP_DIR/install-vps.sh << EOF
#!/bin/bash

echo "🔧 Instalando AstroZuri en VPS..."

# Crear directorio
sudo mkdir -p /var/www/astrozuri
sudo chown -R www-data:www-data /var/www/astrozuri

# Copiar archivos
sudo cp -r * /var/www/astrozuri/
sudo chown -R www-data:www-data /var/www/astrozuri

# Instalar dependencias del backend
cd /var/www/astrozuri/backend
sudo npm install --production

# Configurar Nginx
sudo cp /var/www/astrozuri/nginx.conf /etc/nginx/sites-available/astrozuri.javiercerna.dev
sudo ln -sf /etc/nginx/sites-available/astrozuri.javiercerna.dev /etc/nginx/sites-enabled/

# Verificar configuración de Nginx
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx

# Instalar PM2 si no está instalado
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Iniciar backend con PM2
cd /var/www/astrozuri/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Instalación completada!"
echo "🔐 Ahora ejecuta: sudo certbot --nginx -d astrozuri.javiercerna.dev"
EOF

chmod +x $TEMP_DIR/install-vps.sh

# Crear archivo .env de ejemplo
cat > $TEMP_DIR/backend/.env.example << EOF
# Configuración de producción
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/astrozuri
JWT_SECRET=your-super-secret-jwt-key-here
NASA_API_KEY=your-nasa-api-key-here

# CORS
CORS_ORIGIN=https://astrozuri.javiercerna.dev
EOF

echo "📋 Pasos para desplegar en tu VPS:"
echo ""
echo "1. Subir archivos al VPS:"
echo "   scp -r $TEMP_DIR/* $VPS_USER@$VPS_HOST:/tmp/astrozuri/"
echo ""
echo "2. Conectar al VPS:"
echo "   ssh $VPS_USER@$VPS_HOST"
echo ""
echo "3. Ejecutar instalación:"
echo "   cd /tmp/astrozuri"
echo "   sudo chmod +x install-vps.sh"
echo "   ./install-vps.sh"
echo ""
echo "4. Configurar SSL:"
echo "   sudo certbot --nginx -d astrozuri.javiercerna.dev"
echo ""
echo "5. Configurar variables de entorno:"
echo "   sudo nano /var/www/astrozuri/backend/.env"
echo "   sudo systemctl restart nginx"
echo "   pm2 restart astrozuri-backend"
echo ""
echo "📁 Archivos preparados en: $TEMP_DIR"
echo "🎉 ¡Listo para desplegar!"
