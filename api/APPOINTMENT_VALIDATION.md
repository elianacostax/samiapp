# Validación de Citas y Prevención de Solapamiento

## 📋 Resumen

El sistema implementa una validación robusta para prevenir solapamiento de citas, asegurando que:
- Los doctores no tengan citas que se solapen
- Los pacientes no puedan agendar múltiples citas al mismo tiempo
- Los horarios disponibles consideren la duración completa de las citas

## ⏱️ Duración de Citas

Por defecto, cada cita tiene una duración de **30 minutos**. Esta constante está definida en `src/utils/appointmentUtils.js`:

```javascript
const APPOINTMENT_DURATION_MINUTES = 30;
```

## 🔍 Lógica de Detección de Solapamiento

### Algoritmo de Verificación

Dos citas se consideran **solapadas** si se cumple alguna de estas condiciones:

1. **La nueva cita inicia durante una cita existente**
   ```
   Existente: [10:00 -------- 10:30]
   Nueva:          [10:15 -------- 10:45]
   ❌ SOLAPA
   ```

2. **La nueva cita termina durante una cita existente**
   ```
   Existente:      [10:30 -------- 11:00]
   Nueva:     [10:00 -------- 10:45]
   ❌ SOLAPA
   ```

3. **La nueva cita contiene completamente a una cita existente**
   ```
   Existente:   [10:15 - 10:45]
   Nueva:     [10:00 -------- 11:00]
   ❌ SOLAPA
   ```

### Casos que NO se consideran solapamiento

```
Existente: [10:00 -- 10:30]
Nueva:                      [10:30 -- 11:00]
✅ NO SOLAPA (terminan/inician exactamente)
```

## 🛡️ Validaciones Implementadas

### 1. Validación al Crear Cita (POST /api/appointments)

```javascript
// Verificaciones realizadas:
✅ Doctor existe y está disponible
✅ Especialidad es válida
✅ Doctor tiene esa especialidad
✅ Fecha no es en el pasado
✅ No hay solapamiento con otras citas del doctor
✅ Paciente no tiene otra cita en ese horario
✅ Hora está dentro del horario del doctor
```

### 2. Horarios Disponibles (GET /api/appointments/available-slots)

Este endpoint genera slots de 30 minutos considerando:

- **Horario del doctor**: Solo muestra slots dentro del horario configurado
- **Citas existentes**: Excluye slots que se solaparían con citas ya agendadas
- **Duración completa**: Considera que cada slot necesita 30 minutos completos

**Ejemplo:**

```javascript
// Horario del doctor: 08:00 - 12:00
// Cita existente: 10:00 - 10:30

Slots disponibles:
✅ 08:00 - 08:30
✅ 08:30 - 09:00
✅ 09:00 - 09:30
✅ 09:30 - 10:00
❌ 10:00 - 10:30 (ocupado)
✅ 10:30 - 11:00
✅ 11:00 - 11:30
✅ 11:30 - 12:00
```

## 📊 Estados de Citas Considerados

Al verificar solapamiento, se consideran las citas con estos estados:

- `SCHEDULED` - Agendada
- `CONFIRMED` - Confirmada
- `IN_PROGRESS` - En progreso

**NO se consideran:**

- `COMPLETED` - Completada
- `CANCELLED` - Cancelada
- `NO_SHOW` - Paciente no se presentó

## 🔧 Funciones Utilitarias

### `checkAppointmentOverlap(newTime, existingAppointments, duration)`

Verifica si una nueva cita se solapa con citas existentes.

**Parámetros:**
- `newTime` (string): Hora de la nueva cita en formato "HH:MM"
- `existingAppointments` (Array): Array de citas con propiedad `time`
- `duration` (number): Duración en minutos (default: 30)

**Retorna:**
```javascript
{
  hasOverlap: boolean,
  conflictingAppointment: Object|null,
  conflictRange: {
    start: string, // "HH:MM"
    end: string    // "HH:MM"
  }
}
```

**Ejemplo de uso:**
```javascript
const { checkAppointmentOverlap } = require('./utils/appointmentUtils');

const result = checkAppointmentOverlap('10:15', existingAppointments);

if (result.hasOverlap) {
  console.log(`Conflicto con cita de ${result.conflictRange.start} a ${result.conflictRange.end}`);
}
```

### `generateAvailableSlots(startTime, endTime, existingAppointments, slotDuration)`

Genera todos los slots disponibles en un rango de tiempo.

**Parámetros:**
- `startTime` (string): Hora de inicio en formato "HH:MM"
- `endTime` (string): Hora de fin en formato "HH:MM"
- `existingAppointments` (Array): Citas ya agendadas
- `slotDuration` (number): Duración de cada slot (default: 30)

**Retorna:**
```javascript
['08:00', '08:30', '09:00', '10:30', '11:00', ...]
```

## 🧪 Casos de Prueba

### Caso 1: Intentar agendar cita que inicia durante otra

```bash
# Cita existente: 10:00 - 10:30
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "...",
    "specialtyId": "...",
    "date": "2025-11-01",
    "time": "10:15",
    "reason": "Consulta"
  }'

# Respuesta esperada:
{
  "success": false,
  "message": "Ya existe una cita que se solapa con este horario. Cita existente: 10:00 - 10:30"
}
```

### Caso 2: Agendar cita inmediatamente después

```bash
# Cita existente: 10:00 - 10:30
# Nueva cita: 10:30 - 11:00
# ✅ Debe funcionar (no hay solapamiento)
```

### Caso 3: Paciente intenta agendar dos citas al mismo tiempo

```bash
# Paciente ya tiene cita: 10:00 - 10:30 con Dr. García
# Intenta agendar: 10:00 - 10:30 con Dra. Martínez
# ❌ Debe rechazarse
```

## 🎯 Ventajas de esta Implementación

1. **Precisión**: Detecta cualquier tipo de solapamiento, no solo coincidencias exactas
2. **Flexibilidad**: Fácil de ajustar la duración de las citas
3. **Rendimiento**: Algoritmo eficiente O(n) para verificación
4. **Mensajes claros**: Informa exactamente cuál es el conflicto
5. **Reutilizable**: Funciones utilitarias pueden usarse en otros contextos
6. **Doble protección**: Valida tanto para el doctor como para el paciente

## 📝 Recomendaciones

- **Tiempo entre citas**: Considera agregar un buffer de 5-10 minutos entre citas si necesitas tiempo de limpieza/preparación
- **Duraciones variables**: Si diferentes especialidades requieren diferentes tiempos, puedes modificar la constante `APPOINTMENT_DURATION_MINUTES` o agregar duración por especialidad
- **Timezone**: Considera agregar manejo de zonas horarias si el sistema será usado en múltiples regiones

## 🔄 Actualizaciones Futuras

Posibles mejoras a considerar:

1. Duración de cita configurable por especialidad
2. Buffer time entre citas
3. Citas recurrentes
4. Bloqueo de horarios para emergencias
5. Sistema de lista de espera
6. Notificaciones de cancelación para ofrecer slots liberados
