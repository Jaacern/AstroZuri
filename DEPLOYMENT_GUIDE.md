# ============================================
# Guía de Despliegue - AstroImpact VR
# VPS con Nginx, Debian 11 y Certbot
# ============================================

## 📋 Requisitos Previos

### 1. Servidor VPS
- **OS**: Debian 11 (Bullseye)
- **RAM**: Mínimo 1GB (recomendado 2GB+)
- **CPU**: Mínimo 1 core (recomendado 2+ cores)
- **Almacenamiento**: Mínimo 10GB (recomendado 20GB+)
- **Acceso**: SSH con permisos sudo

### 2. Dominio
- Dominio registrado apuntando a la IP del VPS
- Registros DNS A configurados correctamente

## 🚀 Pasos de Despliegue

### Paso 1: Preparar el Servidor

```bash
# Conectar al VPS
ssh root@tu-servidor-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias básicas
apt install -y curl wget git unzip
```

### Paso 2: Subir el Código

**Opción A: Desde GitHub (Recomendado)**
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/astroimpact.git
cd astroimpact
```

**Opción B: Subir archivos manualmente**
```bash
# Usar scp para subir archivos
scp -r /home/fox/Música/APPCHALLENGE/AstroImpact root@tu-servidor-ip:/root/
```

### Paso 3: Ejecutar Script de Despliegue

```bash
# Hacer ejecutable el script
chmod +x deploy.sh

# Editar el dominio en el script
nano deploy.sh
# Cambiar DOMAIN_NAME="tu-dominio.com" por tu dominio real

# Ejecutar despliegue
./deploy.sh
```

### Paso 4: Configurar Base de Datos (Opcional)

Si quieres usar MongoDB local:
```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Iniciar MongoDB
systemctl start mongod
systemctl enable mongod
```

## 🔧 Configuración Manual (Si es necesario)

### 1. Configurar Variables de Entorno

```bash
# Editar archivo .env
nano /var/www/astroimpact/backend/.env
```

Variables importantes:
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://tu-dominio.com
MONGODB_URI=mongodb://localhost:27017/astroimpact
JWT_SECRET=tu-clave-secreta-muy-segura
NASA_API_KEY=tu-clave-nasa-real
```

### 2. Configurar Nginx Manualmente

```bash
# Crear configuración
nano /etc/nginx/sites-available/astroimpact

# Habilitar sitio
ln -s /etc/nginx/sites-available/astroimpact /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Configurar SSL con Certbot

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
certbot renew --dry-run
```

## 🔍 Verificación y Monitoreo

### Verificar Servicios
```bash
# Estado del backend
systemctl status astroimpact-backend

# Estado de Nginx
systemctl status nginx

# Logs del backend
journalctl -u astroimpact-backend -f

# Logs de Nginx
tail -f /var/log/nginx/astroimpact.access.log
```

### Comandos Útiles
```bash
# Reiniciar backend
systemctl restart astroimpact-backend

# Recargar Nginx
systemctl reload nginx

# Verificar configuración Nginx
nginx -t

# Verificar SSL
certbot certificates
```

## 🛠️ Mantenimiento

### Actualizar la Aplicación
```bash
# Detener servicios
systemctl stop astroimpact-backend

# Actualizar código
git pull origin main

# Reconstruir frontend
cd frontend
npm run build
sudo cp -r build/* /var/www/astroimpact/

# Actualizar backend
cd ../backend
npm install --production
sudo cp -r . /var/www/astroimpact/backend/

# Reiniciar servicios
systemctl start astroimpact-backend
systemctl reload nginx
```

### Backup
```bash
# Crear backup de la aplicación
tar -czf astroimpact-backup-$(date +%Y%m%d).tar.gz /var/www/astroimpact/

# Backup de configuración
tar -czf nginx-config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/
```

## 🚨 Solución de Problemas

### Error: Puerto 80/443 ocupado
```bash
# Verificar qué está usando el puerto
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Detener servicio conflictivo
systemctl stop apache2  # Si Apache está corriendo
```

### Error: Permisos de archivos
```bash
# Corregir permisos
chown -R astroimpact:astroimpact /var/www/astroimpact/
chmod -R 755 /var/www/astroimpact/
```

### Error: SSL no funciona
```bash
# Verificar DNS
nslookup tu-dominio.com

# Verificar certificado
openssl x509 -in /etc/letsencrypt/live/tu-dominio.com/fullchain.pem -text -noout
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `journalctl -u astroimpact-backend -f`
2. Verifica configuración: `nginx -t`
3. Comprueba DNS: `nslookup tu-dominio.com`
4. Verifica SSL: `certbot certificates`

## 🎯 URLs Importantes

- **Aplicación**: https://tu-dominio.com
- **API**: https://tu-dominio.com/api/
- **VR Experience**: https://tu-dominio.com/vr
- **Logs**: `/var/log/nginx/astroimpact.access.log`

