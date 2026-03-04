# 🏥 MediCitas - Sistema de Gestión de Citas Médicas

Sistema completo de reservas de citas médicas para centros de salud, desarrollado con stack moderno y arquitectura escalable.

## 📋 Descripción

MediCitas es una plataforma web completa que permite a pacientes agendar citas médicas con especialistas de manera fácil y rápida. El sistema incluye gestión de doctores, especialidades, horarios y citas con prevención inteligente de solapamientos.

## 🚀 Tecnologías

### Backend
- **Node.js** + **Express** - API REST
- **PostgreSQL** - Base de datos relacional
- **Prisma ORM** - Gestión de base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Express Validator** - Validación de datos

### Frontend
- **React 18** + **TypeScript** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes UI
- **Axios** - Cliente HTTP
- **React Router** - Navegación
- **TanStack Query** - Estado del servidor

## ✨ Características Principales

### Para Pacientes
- ✅ Registro y autenticación segura
- ✅ Búsqueda de doctores por especialidad
- ✅ Visualización de horarios disponibles en tiempo real
- ✅ Agendamiento de citas sin solapamientos
- ✅ Historial completo de citas
- ✅ Cancelación de citas
- ✅ Dashboard con estadísticas

### Para Doctores
- ✅ Perfil profesional con especialidades
- ✅ Configuración de horarios de atención
- ✅ Gestión de citas
- ✅ Visualización de agenda

### Para Administradores
- ✅ Gestión de usuarios
- ✅ Gestión de especialidades
- ✅ Control de accesos
- ✅ Administración completa del sistema

## 🛡️ Seguridad

- Autenticación JWT con tokens de larga duración
- Contraseñas encriptadas con bcrypt (12 rounds)
- Rate limiting para prevenir ataques
- Validación de entrada en todos los endpoints
- CORS configurado
- Helmet.js para headers de seguridad
- Roles de usuario (Patient, Doctor, Admin)

## 🔍 Validación de Citas

Sistema inteligente de prevención de solapamiento que:
- Detecta conflictos en tiempo real
- Considera duración completa de citas (30 min)
- Valida disponibilidad del doctor
- Previene dobles reservas del paciente
- Muestra solo horarios realmente disponibles

## 📁 Estructura del Proyecto

```
CitasApp/
├── api/                          # Backend
│   ├── src/
│   │   ├── config/              # Configuraciones
│   │   │   └── database.js      # Conexión a PostgreSQL
│   │   ├── middleware/          # Middlewares
│   │   │   ├── auth.js          # Autenticación JWT
│   │   │   ├── errorHandler.js # Manejo de errores
│   │   │   └── validation.js   # Validaciones
│   │   ├── routes/              # Endpoints
│   │   │   ├── auth.js         # Login/Registro
│   │   │   ├── users.js        # Usuarios
│   │   │   ├── doctors.js      # Doctores
│   │   │   ├── appointments.js # Citas
│   │   │   └── specialties.js  # Especialidades
│   │   ├── utils/              # Utilidades
│   │   │   └── appointmentUtils.js # Lógica de citas
│   │   ├── server.js           # Servidor Express
│   │   └── seed.js            # Datos de prueba
│   ├── prisma/
│   │   └── schema.prisma      # Esquema de BD
│   ├── package.json
│   └── README.md
│
└── client/                      # Frontend
    ├── src/
    │   ├── components/         # Componentes React
    │   │   ├── ui/            # Shadcn/ui components
    │   │   └── Layout.tsx     # Layout principal
    │   ├── hooks/             # Custom hooks
    │   │   └── useAuth.tsx   # Hook de autenticación
    │   ├── pages/             # Páginas
    │   │   ├── Auth.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Doctors.tsx
    │   │   ├── Appointments.tsx
    │   │   └── NewAppointment.tsx
    │   ├── services/          # API services
    │   │   └── api.ts        # Cliente API
    │   └── App.tsx
    ├── package.json
    └── README.md
```

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd CitasApp
```

### 2. Configurar Backend

```bash
cd api
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones
npm run db:migrate

# Poblar base de datos con datos de prueba
npm run db:seed

# Iniciar servidor
npm run dev
```

El backend estará en `http://localhost:3000`

### 3. Configurar Frontend

```bash
cd client
npm install

# Configurar variables de entorno
cp env.example .env
# VITE_API_URL=http://localhost:3000/api

# Iniciar aplicación
npm run dev
```

El frontend estará en `http://localhost:5173`

## 👥 Usuarios de Prueba

### Administrador
- Email: `admin@citasmedicas.com`
- Password: `admin123`

### Doctores
- Email: `dr.garcia@citasmedicas.com` / Password: `doctor123`
- Email: `dra.martinez@citasmedicas.com` / Password: `doctor123`
- Email: `dr.rodriguez@citasmedicas.com` / Password: `doctor123`

### Pacientes
- Email: `maria.lopez@email.com` / Password: `patient123`
- Email: `juan.perez@email.com` / Password: `patient123`

## 📚 Documentación de API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Usuario actual
- `PUT /api/auth/change-password` - Cambiar contraseña

#### Doctores
- `GET /api/doctors` - Lista de doctores
- `GET /api/doctors/:id` - Doctor por ID
- `POST /api/doctors/info` - Crear perfil de doctor
- `POST /api/doctors/schedules` - Crear horario

#### Citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments` - Listar citas del usuario
- `GET /api/appointments/:id` - Detalle de cita
- `PUT /api/appointments/:id/status` - Actualizar estado
- `DELETE /api/appointments/:id` - Cancelar cita
- `GET /api/appointments/available-slots` - Horarios disponibles

#### Especialidades
- `GET /api/specialties` - Lista de especialidades
- `GET /api/specialties/:id/doctors` - Doctores por especialidad

Ver documentación completa en `/api/README.md`

## 🎨 Capturas de Pantalla

[Las capturas se pueden agregar aquí]

## 🧪 Testing

```bash
# Backend
cd api
npm test

# Frontend
cd client
npm test
```

## 📦 Build para Producción

### Backend
```bash
cd api
npm start
```

### Frontend
```bash
cd client
npm run build
# Los archivos estarán en client/dist/
```

## 🌐 Despliegue en AWS

### Arquitectura Sugerida

1. **Frontend**: S3 + CloudFront
2. **Backend**: EC2 / ECS / Lambda
3. **Base de Datos**: RDS PostgreSQL
4. **Dominio**: Route 53
5. **SSL**: Certificate Manager

### Pasos Básicos

1. **Base de Datos**
   - Crear RDS PostgreSQL
   - Ejecutar migraciones

2. **Backend**
   - Desplegar en EC2/ECS
   - Configurar security groups
   - Variables de entorno

3. **Frontend**
   - Build del proyecto
   - Subir a S3
   - Configurar CloudFront
   - HTTPS con ACM

## 🔧 Configuración Avanzada

### Variables de Entorno Backend

```env
DATABASE_URL=postgresql://user:pass@host:5432/db_name
JWT_SECRET=tu_secret_seguro_aqui
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Variables de Entorno Frontend

```env
VITE_API_URL=https://api.tu-dominio.com/api
```

## 📈 Mejoras Futuras

- [ ] Notificaciones por email/SMS
- [ ] Sistema de recordatorios automáticos
- [ ] Videoconsultas
- [ ] Historial médico del paciente
- [ ] Recetas electrónicas
- [ ] Integración con sistemas de pago
- [ ] App móvil (React Native)
- [ ] Panel de analíticas
- [ ] Exportación de reportes
- [ ] Multi-idioma

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Sergio

## 📞 Soporte

Para soporte, por favor crear un issue en el repositorio o contactar al equipo de desarrollo.

---

⭐ Si este proyecto te fue útil, por favor considera darle una estrella en GitHub!
