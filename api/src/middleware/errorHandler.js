// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Middleware global para manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('Error:', err);

  // Error de validación de Prisma
  if (err.code === 'P2002') {
    const message = 'Recurso duplicado';
    error = { message, status: 400 };
  }

  // Error de registro no encontrado en Prisma
  if (err.code === 'P2025') {
    const message = 'Recurso no encontrado';
    error = { message, status: 404 };
  }

  // Error de validación de Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = { message, status: 400 };
  }

  // Error de validación de express-validator
  if (err.type === 'validation') {
    const message = err.errors.map(e => e.msg).join(', ');
    error = { message, status: 400 };
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};
