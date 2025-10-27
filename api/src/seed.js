const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Crear especialidades
    console.log('📋 Creando especialidades...');
    const specialties = await Promise.all([
      prisma.specialty.upsert({
        where: { name: 'Medicina General' },
        update: {},
        create: {
          name: 'Medicina General',
          description: 'Atención médica integral para pacientes de todas las edades'
        }
      }),
      prisma.specialty.upsert({
        where: { name: 'Cardiología' },
        update: {},
        create: {
          name: 'Cardiología',
          description: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades del corazón'
        }
      }),
      prisma.specialty.upsert({
        where: { name: 'Dermatología' },
        update: {},
        create: {
          name: 'Dermatología',
          description: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades de la piel'
        }
      }),
      prisma.specialty.upsert({
        where: { name: 'Pediatría' },
        update: {},
        create: {
          name: 'Pediatría',
          description: 'Especialidad médica que se ocupa del cuidado de la salud de los niños'
        }
      }),
      prisma.specialty.upsert({
        where: { name: 'Ginecología' },
        update: {},
        create: {
          name: 'Ginecología',
          description: 'Especialidad médica que se ocupa del sistema reproductor femenino'
        }
      }),
      prisma.specialty.upsert({
        where: { name: 'Oftalmología' },
        update: {},
        create: {
          name: 'Oftalmología',
          description: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades de los ojos'
        }
      })
    ]);

    console.log(`✅ ${specialties.length} especialidades creadas`);

    // Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@citasmedicas.com' },
      update: {},
      create: {
        email: 'admin@citasmedicas.com',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ Usuario administrador creado');

    // Crear doctores de ejemplo
    console.log('👨‍⚕️ Creando doctores de ejemplo...');
    
    const doctor1Password = await bcrypt.hash('doctor123', 12);
    const doctor1 = await prisma.user.upsert({
      where: { email: 'dr.garcia@citasmedicas.com' },
      update: {},
      create: {
        email: 'dr.garcia@citasmedicas.com',
        password: doctor1Password,
        firstName: 'Carlos',
        lastName: 'García',
        phone: '+1234567890',
        role: 'DOCTOR',
        isActive: true
      }
    });

    const doctor2Password = await bcrypt.hash('doctor123', 12);
    const doctor2 = await prisma.user.upsert({
      where: { email: 'dra.martinez@citasmedicas.com' },
      update: {},
      create: {
        email: 'dra.martinez@citasmedicas.com',
        password: doctor2Password,
        firstName: 'Ana',
        lastName: 'Martínez',
        phone: '+1234567891',
        role: 'DOCTOR',
        isActive: true
      }
    });

    const doctor3Password = await bcrypt.hash('doctor123', 12);
    const doctor3 = await prisma.user.upsert({
      where: { email: 'dr.rodriguez@citasmedicas.com' },
      update: {},
      create: {
        email: 'dr.rodriguez@citasmedicas.com',
        password: doctor3Password,
        firstName: 'Miguel',
        lastName: 'Rodríguez',
        phone: '+1234567892',
        role: 'DOCTOR',
        isActive: true
      }
    });

    // Crear información de doctores
    const doctor1Info = await prisma.doctorInfo.upsert({
      where: { userId: doctor1.id },
      update: {},
      create: {
        userId: doctor1.id,
        license: 'MED001',
        specialties: ['Medicina General', 'Cardiología'],
        experience: 15,
        consultationFee: 80.00,
        bio: 'Doctor con más de 15 años de experiencia en medicina general y cardiología. Especializado en prevención y tratamiento de enfermedades cardiovasculares.',
        isAvailable: true
      }
    });

    const doctor2Info = await prisma.doctorInfo.upsert({
      where: { userId: doctor2.id },
      update: {},
      create: {
        userId: doctor2.id,
        license: 'DER001',
        specialties: ['Dermatología'],
        experience: 10,
        consultationFee: 90.00,
        bio: 'Dermatóloga especializada en el tratamiento de enfermedades de la piel, cabello y uñas. Experiencia en dermatología estética y médica.',
        isAvailable: true
      }
    });

    const doctor3Info = await prisma.doctorInfo.upsert({
      where: { userId: doctor3.id },
      update: {},
      create: {
        userId: doctor3.id,
        license: 'PED001',
        specialties: ['Pediatría'],
        experience: 12,
        consultationFee: 75.00,
        bio: 'Pediatra con amplia experiencia en el cuidado de niños y adolescentes. Especializado en medicina preventiva y desarrollo infantil.',
        isAvailable: true
      }
    });

    console.log('✅ Doctores de ejemplo creados');

    // Crear horarios para los doctores
    console.log('⏰ Creando horarios de doctores...');
    
    // Horarios para Dr. García (Lunes a Viernes, 8:00-17:00)
    const doctor1Schedules = [];
    for (let day = 1; day <= 5; day++) {
      doctor1Schedules.push({
        doctorId: doctor1Info.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '17:00',
        isActive: true
      });
    }

    // Horarios para Dra. Martínez (Lunes, Miércoles, Viernes, 9:00-18:00)
    const doctor2Schedules = [
      { doctorId: doctor2Info.id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
      { doctorId: doctor2Info.id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
      { doctorId: doctor2Info.id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isActive: true }
    ];

    // Horarios para Dr. Rodríguez (Martes y Jueves, 10:00-19:00)
    const doctor3Schedules = [
      { doctorId: doctor3Info.id, dayOfWeek: 2, startTime: '10:00', endTime: '19:00', isActive: true },
      { doctorId: doctor3Info.id, dayOfWeek: 4, startTime: '10:00', endTime: '19:00', isActive: true }
    ];

    await prisma.doctorSchedule.createMany({
      data: [...doctor1Schedules, ...doctor2Schedules, ...doctor3Schedules],
      skipDuplicates: true
    });

    console.log('✅ Horarios de doctores creados');

    // Crear pacientes de ejemplo
    console.log('👥 Creando pacientes de ejemplo...');
    
    const patient1Password = await bcrypt.hash('patient123', 12);
    const patient1 = await prisma.user.upsert({
      where: { email: 'maria.lopez@email.com' },
      update: {},
      create: {
        email: 'maria.lopez@email.com',
        password: patient1Password,
        firstName: 'María',
        lastName: 'López',
        phone: '+1234567893',
        role: 'PATIENT',
        isActive: true
      }
    });

    const patient2Password = await bcrypt.hash('patient123', 12);
    const patient2 = await prisma.user.upsert({
      where: { email: 'juan.perez@email.com' },
      update: {},
      create: {
        email: 'juan.perez@email.com',
        password: patient2Password,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+1234567894',
        role: 'PATIENT',
        isActive: true
      }
    });

    console.log('✅ Pacientes de ejemplo creados');

    // Crear algunas citas de ejemplo
    console.log('📅 Creando citas de ejemplo...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const appointments = [
      {
        patientId: patient1.id,
        doctorId: doctor1Info.id,
        specialtyId: specialties[0].id, // Medicina General
        date: tomorrow,
        time: '10:00',
        reason: 'Consulta de rutina y revisión general',
        status: 'SCHEDULED'
      },
      {
        patientId: patient2.id,
        doctorId: doctor2Info.id,
        specialtyId: specialties[2].id, // Dermatología
        date: nextWeek,
        time: '15:00',
        reason: 'Revisión de lunares y manchas en la piel',
        status: 'SCHEDULED'
      }
    ];

    for (const appointmentData of appointments) {
      const appointment = await prisma.patientAppointment.create({
        data: appointmentData
      });

      // Crear también en doctor_appointments
      await prisma.doctorAppointment.create({
        data: {
          doctorId: appointmentData.doctorId,
          patientId: appointmentData.patientId,
          specialtyId: appointmentData.specialtyId,
          date: appointmentData.date,
          time: appointmentData.time,
          reason: appointmentData.reason,
          status: appointmentData.status
        }
      });
    }

    console.log('✅ Citas de ejemplo creadas');

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('👤 Admin: admin@citasmedicas.com / admin123');
    console.log('👨‍⚕️ Doctor 1: dr.garcia@citasmedicas.com / doctor123');
    console.log('👩‍⚕️ Doctor 2: dra.martinez@citasmedicas.com / doctor123');
    console.log('👨‍⚕️ Doctor 3: dr.rodriguez@citasmedicas.com / doctor123');
    console.log('👥 Paciente 1: maria.lopez@email.com / patient123');
    console.log('👥 Paciente 2: juan.perez@email.com / patient123');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
