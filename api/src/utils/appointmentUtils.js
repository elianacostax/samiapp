/**
 * Utilidades para manejo de citas médicas
 */

// Duración estándar de una cita en minutos
const APPOINTMENT_DURATION_MINUTES = 30;

/**
 * Convierte una hora en formato HH:MM a minutos desde medianoche
 * @param {string} time - Hora en formato HH:MM
 * @returns {number} Minutos desde medianoche
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convierte minutos desde medianoche a formato HH:MM
 * @param {number} minutes - Minutos desde medianoche
 * @returns {string} Hora en formato HH:MM
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Verifica si dos rangos de tiempo se solapan
 * @param {number} start1 - Inicio del primer rango en minutos
 * @param {number} end1 - Fin del primer rango en minutos
 * @param {number} start2 - Inicio del segundo rango en minutos
 * @param {number} end2 - Fin del segundo rango en minutos
 * @returns {boolean} True si hay solapamiento
 */
const hasTimeOverlap = (start1, end1, start2, end2) => {
  return (
    (start1 >= start2 && start1 < end2) ||  // start1 está dentro del rango 2
    (end1 > start2 && end1 <= end2) ||      // end1 está dentro del rango 2
    (start1 <= start2 && end1 >= end2)      // rango 1 contiene completamente al rango 2
  );
};

/**
 * Verifica si una nueva cita se solapa con citas existentes
 * @param {string} newTime - Hora de la nueva cita en formato HH:MM
 * @param {Array} existingAppointments - Array de citas existentes con propiedad 'time'
 * @param {number} duration - Duración de la cita en minutos (por defecto 30)
 * @returns {Object} { hasOverlap: boolean, conflictingAppointment: Object|null }
 */
const checkAppointmentOverlap = (newTime, existingAppointments, duration = APPOINTMENT_DURATION_MINUTES) => {
  const newStartMinutes = timeToMinutes(newTime);
  const newEndMinutes = newStartMinutes + duration;

  for (const existing of existingAppointments) {
    const existStartMinutes = timeToMinutes(existing.time);
    const existEndMinutes = existStartMinutes + duration;

    if (hasTimeOverlap(newStartMinutes, newEndMinutes, existStartMinutes, existEndMinutes)) {
      return {
        hasOverlap: true,
        conflictingAppointment: existing,
        conflictRange: {
          start: minutesToTime(existStartMinutes),
          end: minutesToTime(existEndMinutes)
        }
      };
    }
  }

  return { hasOverlap: false, conflictingAppointment: null };
};

/**
 * Genera slots de tiempo disponibles considerando citas existentes
 * @param {string} startTime - Hora de inicio en formato HH:MM
 * @param {string} endTime - Hora de fin en formato HH:MM
 * @param {Array} existingAppointments - Array de citas existentes
 * @param {number} slotDuration - Duración de cada slot en minutos (por defecto 30)
 * @returns {Array} Array de strings con horarios disponibles en formato HH:MM
 */
const generateAvailableSlots = (startTime, endTime, existingAppointments, slotDuration = APPOINTMENT_DURATION_MINUTES) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Convertir citas existentes a rangos
  const bookedRanges = existingAppointments.map(apt => ({
    start: timeToMinutes(apt.time),
    end: timeToMinutes(apt.time) + slotDuration
  }));

  const availableSlots = [];
  let currentMinutes = startMinutes;

  while (currentMinutes < endMinutes) {
    const slotEndMinutes = currentMinutes + slotDuration;
    
    // Verificar que el slot completo cabe en el horario
    if (slotEndMinutes > endMinutes) {
      break;
    }

    // Verificar si este slot se solapa con alguna cita
    const hasOverlap = bookedRanges.some(range => 
      hasTimeOverlap(currentMinutes, slotEndMinutes, range.start, range.end)
    );

    if (!hasOverlap) {
      availableSlots.push(minutesToTime(currentMinutes));
    }

    currentMinutes += slotDuration;
  }

  return availableSlots;
};

/**
 * Valida que una hora esté dentro del horario de trabajo
 * @param {string} time - Hora a validar en formato HH:MM
 * @param {string} startTime - Hora de inicio del horario
 * @param {string} endTime - Hora de fin del horario
 * @param {number} duration - Duración de la cita en minutos
 * @returns {boolean} True si la hora es válida
 */
const isTimeWithinSchedule = (time, startTime, endTime, duration = APPOINTMENT_DURATION_MINUTES) => {
  const timeMinutes = timeToMinutes(time);
  const endTimeMinutes = timeMinutes + duration;
  const scheduleStart = timeToMinutes(startTime);
  const scheduleEnd = timeToMinutes(endTime);

  return timeMinutes >= scheduleStart && endTimeMinutes <= scheduleEnd;
};

/**
 * Obtiene el día de la semana en formato numérico (0-6)
 * @param {Date} date - Fecha
 * @returns {number} Día de la semana (0=Domingo, 6=Sábado)
 */
const getDayOfWeek = (date) => {
  return new Date(date).getDay();
};

/**
 * Verifica si una fecha es en el pasado
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} True si la fecha es en el pasado
 */
const isPastDate = (date) => {
  const appointmentDate = new Date(date);
  const now = new Date();
  
  // Comparar solo las fechas, ignorando la hora
  appointmentDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return appointmentDate < now;
};

/**
 * Formatea una fecha a string legible
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  APPOINTMENT_DURATION_MINUTES,
  timeToMinutes,
  minutesToTime,
  hasTimeOverlap,
  checkAppointmentOverlap,
  generateAvailableSlots,
  isTimeWithinSchedule,
  getDayOfWeek,
  isPastDate,
  formatDate
};
