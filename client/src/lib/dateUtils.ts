/**
 * Parsea una fecha en formato ISO o yyyy-MM-dd a una fecha local
 * sin problemas de timezone
 */
export const parseLocalDate = (dateString: string): Date => {
  // Si viene en formato ISO completo, extraer solo la parte de la fecha
  const dateOnly = dateString.split('T')[0];
  
  // Parsear como fecha local
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formatea una fecha para enviar al backend en formato yyyy-MM-dd
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
