const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para autenticación
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nombre debe tener al menos 2 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Apellido debe tener al menos 2 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Teléfono debe ser válido'),
  body('role')
    .optional()
    .isIn(['PATIENT', 'DOCTOR'])
    .withMessage('Rol debe ser PATIENT o DOCTOR'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .notEmpty()
    .withMessage('Contraseña es requerida'),
  handleValidationErrors
];

// Validaciones para citas
const validateAppointment = [
  body('doctorId')
    .isString().notEmpty()
    .withMessage('ID del doctor debe ser válido'),
  body('specialtyId')
    .isString().notEmpty()
    .withMessage('ID de especialidad debe ser válido'),
  body('date')
    .isISO8601()
    .withMessage('Fecha debe ser válida (ISO 8601)'),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora debe estar en formato HH:MM'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Motivo debe tener al menos 10 caracteres'),
  handleValidationErrors
];

// Validaciones para información de doctor
const validateDoctorInfo = [
  body('license')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Número de licencia debe tener al menos 5 caracteres'),
  body('specialties')
    .isArray({ min: 1 })
    .withMessage('Debe especificar al menos una especialidad'),
  body('experience')
    .isInt({ min: 0 })
    .withMessage('Experiencia debe ser un número positivo'),
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Tarifa de consulta debe ser un número positivo'),
  body('bio')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('Biografía debe tener al menos 20 caracteres'),
  handleValidationErrors
];

// Validaciones para horarios de doctor
const validateDoctorSchedule = [
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio debe estar en formato HH:MM'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin debe estar en formato HH:MM'),
  handleValidationErrors
];

// Validaciones para parámetros UUID
const validateUUID = (paramName) => [
  param(paramName)
    .isString().notEmpty()
    .withMessage(`${paramName} debe ser un UUID válido`),
  handleValidationErrors
];

// Validaciones para consultas de paginación
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateAppointment,
  validateDoctorInfo,
  validateDoctorSchedule,
  validateUUID,
  validatePagination
};
