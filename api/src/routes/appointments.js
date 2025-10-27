const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateAppointment, validatePagination, validateUUID } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/appointments
// @desc    Crear nueva cita
// @access  Private (Patient)
router.post('/', authenticateToken, requireRole('PATIENT'), validateAppointment, async (req, res) => {
  try {
    const { doctorId, specialtyId, date, time, reason } = req.body;
    const patientId = req.user.id;

    // Verificar que el doctor existe y está disponible
    const doctor = await prisma.doctorInfo.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: { isActive: true }
        }
      }
    });

    if (!doctor || !doctor.isAvailable || !doctor.user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Doctor no disponible'
      });
    }

    // Verificar que la especialidad existe
    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId }
    });

    if (!specialty || !specialty.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Especialidad no válida'
      });
    }

    // Verificar que la especialidad está en las especialidades del doctor
    if (!doctor.specialties.includes(specialty.name)) {
      return res.status(400).json({
        success: false,
        message: 'El doctor no tiene esta especialidad'
      });
    }

    // Verificar que la fecha no sea en el pasado
    const appointmentDate = new Date(date);
    const now = new Date();
    if (appointmentDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden agendar citas en el pasado'
      });
    }

    // Verificar que no hay conflicto de horario
    const existingAppointment = await prisma.patientAppointment.findFirst({
      where: {
        doctorId,
        date: appointmentDate,
        time,
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita en este horario'
      });
    }

    // Crear la cita
    const appointment = await prisma.patientAppointment.create({
      data: {
        patientId,
        doctorId,
        specialtyId,
        date: appointmentDate,
        time,
        reason
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        specialty: {
          select: {
            name: true
          }
        }
      }
    });

    // Crear también el registro en doctor_appointments
    await prisma.doctorAppointment.create({
      data: {
        doctorId,
        patientId,
        specialtyId,
        date: appointmentDate,
        time,
        reason
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cita agendada exitosamente',
      data: { appointment }
    });
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/appointments
// @desc    Obtener citas del usuario actual
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const userId = req.user.id;

    const where = {
      OR: [
        { patientId: userId },
        { doctor: { userId: userId } }
      ]
    };

    if (status) {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.patientAppointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          specialty: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ]
      }),
      prisma.patientAppointment.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Obtener cita por ID
// @access  Private
router.get('/:id', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const appointment = await prisma.patientAppointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        specialty: {
          select: {
            name: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar que el usuario tiene acceso a esta cita
    const userId = req.user.id;
    if (appointment.patientId !== userId && appointment.doctor.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta cita'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Actualizar estado de cita
// @access  Private
router.put('/:id/status', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const userId = req.user.id;

    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de cita no válido'
      });
    }

    const appointment = await prisma.patientAppointment.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar permisos
    const canUpdate = 
      appointment.patientId === userId || 
      appointment.doctor.userId === userId || 
      req.user.role === 'ADMIN';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta cita'
      });
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;

    const updatedAppointment = await prisma.patientAppointment.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        specialty: {
          select: {
            name: true
          }
        }
      }
    });

    // Actualizar también en doctor_appointments
    await prisma.doctorAppointment.updateMany({
      where: {
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        date: appointment.date,
        time: appointment.time
      },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Estado de cita actualizado exitosamente',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    console.error('Error actualizando estado de cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancelar cita
// @access  Private
router.delete('/:id', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const userId = req.user.id;

    const appointment = await prisma.patientAppointment.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar permisos
    const canCancel = 
      appointment.patientId === userId || 
      appointment.doctor.userId === userId || 
      req.user.role === 'ADMIN';

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cancelar esta cita'
      });
    }

    // Verificar que la cita se puede cancelar
    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta cita no se puede cancelar'
      });
    }

    // Actualizar estado a CANCELLED
    await prisma.patientAppointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    // Actualizar también en doctor_appointments
    await prisma.doctorAppointment.updateMany({
      where: {
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        date: appointment.date,
        time: appointment.time
      },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/appointments/available-slots
// @desc    Obtener horarios disponibles para un doctor en una fecha
// @access  Public
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'doctorId y date son requeridos'
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Obtener horario del doctor para este día
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true
      }
    });

    if (!schedule) {
      return res.json({
        success: true,
        data: { slots: [] }
      });
    }

    // Obtener citas existentes para esta fecha
    const existingAppointments = await prisma.patientAppointment.findMany({
      where: {
        doctorId,
        date: appointmentDate,
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      select: { time: true }
    });

    const bookedTimes = existingAppointments.map(apt => apt.time);

    // Generar slots de 30 minutos
    const slots = [];
    const startTime = schedule.startTime;
    const endTime = schedule.endTime;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      
      if (!bookedTimes.includes(timeString)) {
        slots.push(timeString);
      }

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    res.json({
      success: true,
      data: { slots }
    });
  } catch (error) {
    console.error('Error obteniendo horarios disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
