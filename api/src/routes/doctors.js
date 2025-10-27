const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateDoctorInfo, validateDoctorSchedule, validatePagination, validateUUID } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/doctors/info
// @desc    Crear información de doctor
// @access  Private (Doctor)
router.post('/info', authenticateToken, requireRole('DOCTOR'), validateDoctorInfo, async (req, res) => {
  try {
    const { license, specialties, experience, consultationFee, bio } = req.body;
    const userId = req.user.id;

    // Verificar si ya tiene información de doctor
    const existingDoctorInfo = await prisma.doctorInfo.findUnique({
      where: { userId }
    });

    if (existingDoctorInfo) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe información de doctor para este usuario'
      });
    }

    // Verificar si la licencia ya existe
    const existingLicense = await prisma.doctorInfo.findUnique({
      where: { license }
    });

    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un doctor con esta licencia'
      });
    }

    const doctorInfo = await prisma.doctorInfo.create({
      data: {
        userId,
        license,
        specialties,
        experience,
        consultationFee,
        bio
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Información de doctor creada exitosamente',
      data: { doctorInfo }
    });
  } catch (error) {
    console.error('Error creando información de doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/doctors/info
// @desc    Actualizar información de doctor
// @access  Private (Doctor)
router.put('/info', authenticateToken, requireRole('DOCTOR'), validateDoctorInfo, async (req, res) => {
  try {
    const { license, specialties, experience, consultationFee, bio, isAvailable } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (license) updateData.license = license;
    if (specialties) updateData.specialties = specialties;
    if (experience !== undefined) updateData.experience = experience;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (bio !== undefined) updateData.bio = bio;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const doctorInfo = await prisma.doctorInfo.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Información de doctor actualizada exitosamente',
      data: { doctorInfo }
    });
  } catch (error) {
    console.error('Error actualizando información de doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/doctors
// @desc    Obtener lista de doctores
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const specialty = req.query.specialty;
    const search = req.query.search || '';

    const where = {
      isAvailable: true,
      user: {
        isActive: true
      }
    };

    if (specialty) {
      where.specialties = {
        has: specialty
      };
    }

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { specialties: { has: search } }
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorInfo.findMany({
        where,
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
      prisma.doctorInfo.count({ where })
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
    console.error('Error obteniendo doctores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/doctors/:id
// @desc    Obtener doctor por ID
// @access  Public
router.get('/:id', validateUUID('id'), async (req, res) => {
  try {
    const doctor = await prisma.doctorInfo.findUnique({
      where: { id: req.params.id },
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
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    console.error('Error obteniendo doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/doctors/schedules
// @desc    Crear horario de doctor
// @access  Private (Doctor)
router.post('/schedules', authenticateToken, requireRole('DOCTOR'), validateDoctorSchedule, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    const userId = req.user.id;

    // Obtener doctor info
    const doctorInfo = await prisma.doctorInfo.findUnique({
      where: { userId }
    });

    if (!doctorInfo) {
      return res.status(404).json({
        success: false,
        message: 'Información de doctor no encontrada'
      });
    }

    // Verificar si ya existe un horario para este día
    const existingSchedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: doctorInfo.id,
        dayOfWeek
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un horario para este día'
      });
    }

    const schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId: doctorInfo.id,
        dayOfWeek,
        startTime,
        endTime
      }
    });

    res.status(201).json({
      success: true,
      message: 'Horario creado exitosamente',
      data: { schedule }
    });
  } catch (error) {
    console.error('Error creando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/doctors/schedules
// @desc    Obtener horarios del doctor actual
// @access  Private (Doctor)
router.get('/schedules', authenticateToken, requireRole('DOCTOR'), async (req, res) => {
  try {
    const userId = req.user.id;

    const doctorInfo = await prisma.doctorInfo.findUnique({
      where: { userId }
    });

    if (!doctorInfo) {
      return res.status(404).json({
        success: false,
        message: 'Información de doctor no encontrada'
      });
    }

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: doctorInfo.id },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/doctors/schedules/:id
// @desc    Actualizar horario de doctor
// @access  Private (Doctor)
router.put('/schedules/:id', authenticateToken, requireRole('DOCTOR'), validateDoctorSchedule, validateUUID('id'), async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, isActive } = req.body;
    const userId = req.user.id;

    // Verificar que el horario pertenece al doctor
    const doctorInfo = await prisma.doctorInfo.findUnique({
      where: { userId }
    });

    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        id: req.params.id,
        doctorId: doctorInfo.id
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }

    const updateData = {};
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSchedule = await prisma.doctorSchedule.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Horario actualizado exitosamente',
      data: { schedule: updatedSchedule }
    });
  } catch (error) {
    console.error('Error actualizando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/doctors/schedules/:id
// @desc    Eliminar horario de doctor
// @access  Private (Doctor)
router.delete('/schedules/:id', authenticateToken, requireRole('DOCTOR'), validateUUID('id'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que el horario pertenece al doctor
    const doctorInfo = await prisma.doctorInfo.findUnique({
      where: { userId }
    });

    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        id: req.params.id,
        doctorId: doctorInfo.id
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }

    await prisma.doctorSchedule.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Horario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
