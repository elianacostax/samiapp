# API de Citas Médicas

API REST para el sistema de reservas de citas médicas desarrollada con Node.js, Express, PostgreSQL y Prisma.

## 🚀 Características

- **Autenticación JWT** con roles de usuario (Patient, Doctor, Admin)
- **Gestión de usuarios** con perfiles diferenciados
- **Sistema de doctores** con especialidades y horarios
- **Reserva de citas** con validaciones de disponibilidad
- **Gestión de especialidades médicas**
- **Rate limiting** y middleware de seguridad
- **Validación de datos** con express-validator
- **Documentación de API** con ejemplos

## 📋 Requisitos

- Node.js 16+ 
- PostgreSQL 12+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd CitasApp/api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env
```

Editar el archivo `.env` con tus configuraciones:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/citas_medicas"
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3001"
```

4. **Configurar la base de datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

5. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `PUT /api/users/:id/status` - Activar/desactivar usuario (Admin)
- `GET /api/users/:id/appointments` - Citas del usuario

### Doctores
- `POST /api/doctors/info` - Crear información de doctor
- `PUT /api/doctors/info` - Actualizar información de doctor
- `GET /api/doctors` - Listar doctores disponibles
- `GET /api/doctors/:id` - Obtener doctor por ID
- `POST /api/doctors/schedules` - Crear horario de doctor
- `GET /api/doctors/schedules` - Obtener horarios del doctor
- `PUT /api/doctors/schedules/:id` - Actualizar horario
- `DELETE /api/doctors/schedules/:id` - Eliminar horario

### Citas
- `POST /api/appointments` - Crear nueva cita
- `GET /api/appointments` - Obtener citas del usuario
- `GET /api/appointments/:id` - Obtener cita por ID
- `PUT /api/appointments/:id/status` - Actualizar estado de cita
- `DELETE /api/appointments/:id` - Cancelar cita
- `GET /api/appointments/available-slots` - Horarios disponibles

### Especialidades
- `GET /api/specialties` - Listar especialidades
- `GET /api/specialties/:id` - Obtener especialidad por ID
- `POST /api/specialties` - Crear especialidad (Admin)
- `PUT /api/specialties/:id` - Actualizar especialidad (Admin)
- `DELETE /api/specialties/:id` - Eliminar especialidad (Admin)
- `GET /api/specialties/:id/doctors` - Doctores de especialidad

## 🔐 Autenticación

La API utiliza JWT para la autenticación. Incluye el token en el header Authorization:

```
Authorization: Bearer <token>
```

### Roles de Usuario
- **PATIENT**: Puede agendar y gestionar sus citas
- **DOCTOR**: Puede gestionar su perfil, horarios y citas
- **ADMIN**: Acceso completo al sistema

## 📊 Modelos de Datos

### Usuario
- Información básica (nombre, email, teléfono)
- Rol (Patient, Doctor, Admin)
- Estado activo/inactivo

### Doctor
- Información profesional (licencia, especialidades)
- Tarifa de consulta
- Horarios de atención
- Disponibilidad

### Cita
- Paciente y doctor
- Fecha y hora
- Especialidad
- Estado (Scheduled, Confirmed, Completed, etc.)
- Motivo y notas

### Especialidad
- Nombre y descripción
- Estado activo/inactivo

## 🛡️ Seguridad

- **Helmet** para headers de seguridad
- **CORS** configurado
- **Rate limiting** para prevenir abuso
- **Validación de entrada** con express-validator
- **Encriptación de contraseñas** con bcrypt
- **JWT** para autenticación

## 🧪 Datos de Prueba

Después de ejecutar `npm run db:seed`, tendrás acceso a:

### Usuarios de Prueba
- **Admin**: admin@citasmedicas.com / admin123
- **Doctor 1**: dr.garcia@citasmedicas.com / doctor123
- **Doctor 2**: dra.martinez@citasmedicas.com / doctor123
- **Doctor 3**: dr.rodriguez@citasmedicas.com / doctor123
- **Paciente 1**: maria.lopez@email.com / patient123
- **Paciente 2**: juan.perez@email.com / patient123

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar servidor en desarrollo
npm run db:migrate # Ejecutar migraciones
npm run db:generate # Generar cliente Prisma
npm run db:seed    # Poblar base de datos
npm run db:studio  # Abrir Prisma Studio
```

## 🔧 Configuración de Desarrollo

1. **Prisma Studio**: `npm run db:studio` para interfaz visual de la BD
2. **Logs**: El servidor muestra logs detallados en desarrollo
3. **Hot reload**: Nodemon reinicia automáticamente en cambios

## 🚀 Despliegue

Para desplegar en producción:

1. Configurar variables de entorno de producción
2. Ejecutar migraciones: `npm run db:migrate`
3. Iniciar servidor: `npm start`

## 📞 Soporte

Para reportar bugs o solicitar características, crear un issue en el repositorio.
