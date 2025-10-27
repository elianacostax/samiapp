const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/specialties
// @desc    Obtener lista de especialidades
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [specialties, total] = await Promise.all([
      prisma.specialty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.specialty.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        specialties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo especialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/specialties/:id
// @desc    Obtener especialidad por ID
// @access  Public
router.get('/:id', validateUUID('id'), async (req, res) => {
  try {
    const specialty = await prisma.specialty.findUnique({
      where: { id: req.params.id }
    });

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    res.json({
      success: true,
      data: { specialty }
    });
  } catch (error) {
    console.error('Error obteniendo especialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/specialties
// @desc    Crear nueva especialidad
// @access  Private (Admin)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la especialidad debe tener al menos 2 caracteres'
      });
    }

    // Verificar si ya existe una especialidad con este nombre
    const existingSpecialty = await prisma.specialty.findUnique({
      where: { name: name.trim() }
    });

    if (existingSpecialty) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una especialidad con este nombre'
      });
    }

    const specialty = await prisma.specialty.create({
      data: {
        name: name.trim(),
        description: description?.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Especialidad creada exitosamente',
      data: { specialty }
    });
  } catch (error) {
    console.error('Error creando especialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/specialties/:id
// @desc    Actualizar especialidad
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireRole('ADMIN'), validateUUID('id'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const specialty = await prisma.specialty.findUnique({
      where: { id: req.params.id }
    });

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    const updateData = {};
    
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la especialidad debe tener al menos 2 caracteres'
        });
      }

      // Verificar si ya existe otra especialidad con este nombre
      const existingSpecialty = await prisma.specialty.findFirst({
        where: {
          name: name.trim(),
          id: { not: req.params.id }
        }
      });

      if (existingSpecialty) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra especialidad con este nombre'
        });
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim();
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedSpecialty = await prisma.specialty.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Especialidad actualizada exitosamente',
      data: { specialty: updatedSpecialty }
    });
  } catch (error) {
    console.error('Error actualizando especialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/specialties/:id
// @desc    Eliminar especialidad (soft delete)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), validateUUID('id'), async (req, res) => {
  try {
    const specialty = await prisma.specialty.findUnique({
      where: { id: req.params.id }
    });

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    // Verificar si hay doctores usando esta especialidad
    const doctorsWithSpecialty = await prisma.doctorInfo.findMany({
      where: {
        specialties: {
          has: specialty.name
        }
      }
    });

    if (doctorsWithSpecialty.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar esta especialidad porque hay doctores que la usan'
      });
    }

    // Soft delete - marcar como inactiva
    await prisma.specialty.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Especialidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando especialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/specialties/:id/doctors
// @desc    Obtener doctores de una especialidad
// @access  Public
router.get('/:id/doctors', validateUUID('id'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const specialty = await prisma.specialty.findUnique({
      where: { id: req.params.id }
    });

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorInfo.findMany({
        where: {
          specialties: {
            has: specialty.name
          },
          isAvailable: true,
          user: {
            isActive: true
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          schedules: {
            where: { isActive: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.doctorInfo.count({
        where: {
          specialties: {
            has: specialty.name
          },
          isAvailable: true,
          user: {
            isActive: true
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo doctores de especialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
