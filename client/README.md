# Cliente MediCitas - Frontend React

Aplicación web para el sistema de gestión de citas médicas desarrollada con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Tecnologías

- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes UI
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **TanStack Query** - Gestión de estado del servidor
- **date-fns** - Manipulación de fechas
- **Sonner** - Notificaciones toast

## 📋 Requisitos Previos

- Node.js 16+
- npm o yarn
- Backend API corriendo en `http://localhost:3000`

## 🛠️ Instalación

1. **Instalar dependencias**
```bash
cd client
npm install
```

2. **Configurar variables de entorno**
```bash
cp env.example .env
```

Edita el archivo `.env` con tu configuración:
```env
VITE_API_URL=http://localhost:3000/api
```

3. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
client/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/          # Componentes de Shadcn/ui
│   │   └── Layout.tsx   # Layout principal
│   ├── hooks/           # Custom hooks
│   │   └── useAuth.tsx  # Hook de autenticación
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Auth.tsx           # Login/Registro
│   │   ├── Dashboard.tsx      # Panel principal
│   │   ├── Doctors.tsx        # Lista de doctores
│   │   ├── Appointments.tsx   # Mis citas
│   │   └── NewAppointment.tsx # Agendar cita
│   ├── services/        # Servicios API
│   │   └── api.ts       # Cliente API y endpoints
│   ├── lib/            # Utilidades
│   │   └── utils.ts    # Funciones helper
│   ├── App.tsx         # Componente raíz
│   └── main.tsx        # Entry point
├── public/             # Assets estáticos
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. El token se almacena en `localStorage` y se envía automáticamente en cada petición mediante interceptores de Axios.

### Flujo de Autenticación

1. Usuario inicia sesión en `/auth`
2. Backend devuelve token JWT
3. Token se guarda en localStorage
4. Todas las peticiones incluyen: `Authorization: Bearer <token>`
5. Si el token expira, usuario es redirigido a login

## 📱 Páginas Principales

### 1. Dashboard (`/`)
- Vista general de estadísticas
- Próximas citas
- Accesos rápidos

### 2. Doctores (`/doctors`)
- Lista de especialistas médicos
- Búsqueda por nombre
- Filtro por especialidad
- Agendar cita directa

### 3. Nueva Cita (`/new-appointment`)
- Selección de especialidad
- Selección de doctor
- Calendario de fechas disponibles
- Horarios disponibles en tiempo real
- Formulario de reserva

### 4. Mis Citas (`/appointments`)
- Historial completo de citas
- Estados: Programada, Confirmada, Completada, Cancelada
- Cancelación de citas
- Detalles de cada consulta

## 🎨 Componentes UI

El proyecto utiliza **Shadcn/ui** con componentes personalizables:

- `Button` - Botones con variantes
- `Card` - Tarjetas de contenido
- `Input` - Campos de entrada
- `Select` - Selects personalizados
- `Calendar` - Calendario de fechas
- `Dialog` - Modales
- `Badge` - Etiquetas
- `Alert` - Alertas
- Y muchos más...

## 🔄 Servicios API

El archivo `src/services/api.ts` contiene todos los servicios organizados:

### Auth API
```typescript
authApi.login(email, password)
authApi.register(email, password, firstName, lastName, phone?)
authApi.logout()
authApi.getCurrentUser()
```

### Doctors API
```typescript
doctorsApi.getAll(page, limit, specialty?, search?)
doctorsApi.getById(id)
```

### Appointments API
```typescript
appointmentsApi.create(data)
appointmentsApi.getAll(page, limit, status?)
appointmentsApi.updateStatus(id, status, notes?)
appointmentsApi.cancel(id)
appointmentsApi.getAvailableSlots(doctorId, date)
```

### Specialties API
```typescript
specialtiesApi.getAll(page, limit, search?)
specialtiesApi.getDoctors(specialtyId, page, limit)
```

## 🎯 Características Principales

### 1. Sistema de Reservas Inteligente
- Muestra solo horarios realmente disponibles
- Previene solapamiento de citas
- Validación en tiempo real

### 2. Gestión de Citas
- Ver historial completo
- Cancelar citas futuras
- Estados visuales claros
- Información detallada de cada cita

### 3. Búsqueda de Doctores
- Búsqueda por nombre
- Filtro por especialidad
- Información completa del doctor
- Horarios de atención
- Tarifas de consulta

### 4. Interfaz Responsiva
- Diseño mobile-first
- Adaptable a todas las pantallas
- Modo oscuro disponible
- Animaciones suaves

## 📦 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter de código
```

## 🔧 Configuración

### Vite Config
El archivo `vite.config.ts` está configurado para:
- Alias de imports (`@/`)
- Optimización de build
- React SWC compiler

### Tailwind Config
Personalización de tema en `tailwind.config.ts`:
- Colores del sistema
- Tipografía
- Animaciones personalizadas
- Variables CSS

## 🌐 Build para Producción

```bash
# Crear build optimizado
npm run build

# El resultado estará en la carpeta dist/
# Puede ser desplegado en cualquier servidor estático
```

### Variables de Entorno para Producción
```env
VITE_API_URL=https://tu-api.com/api
```

## 🚀 Despliegue

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

### AWS S3 + CloudFront
```bash
npm run build
aws s3 sync dist/ s3://tu-bucket
```

## 🐛 Debugging

### Dev Tools
- React DevTools
- Redux DevTools (si usas Redux)
- Network tab para API calls
- Console para logs

### Common Issues

**Error de CORS**
- Verifica que el backend tenga CORS configurado
- Revisa que `VITE_API_URL` sea correcta

**Token expirado**
- El sistema redirige automáticamente a `/auth`
- Re-inicia sesión

**Horarios no cargan**
- Verifica que el doctor tenga horarios configurados
- Comprueba que la fecha seleccionada sea válida

## 📝 Notas de Desarrollo

- El proyecto usa **ESLint** para linting
- **Prettier** está configurado para formateo
- Los commits deben seguir **Conventional Commits**
- Todas las peticiones API incluyen manejo de errores
- Los errores se muestran con notificaciones toast

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar características, crear un issue en el repositorio.