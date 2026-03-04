import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorsApi, specialtiesApi, appointmentsApi, DoctorInfo, Specialty } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Stethoscope, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const NewAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedDoctorId = location.state?.doctorId;

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<(DoctorInfo & { user?: any })[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctorId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      // Limpiar selección de doctor al cambiar especialidad
      setSelectedDoctor('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setAvailableSlots([]);
      fetchDoctorsBySpecialty();
    } else {
      // Si no hay especialidad seleccionada, limpiar todo
      setDoctors([]);
      setSelectedDoctor('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setAvailableSlots([]);
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDoctor, selectedDate]);

  const fetchSpecialties = async () => {
    try {
      const response = await specialtiesApi.getAll(1, 50);
      if (response.data) {
        setSpecialties(response.data.specialties);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Error al cargar especialidades');
    }
  };

  const fetchDoctorsBySpecialty = async () => {
    try {
      // Encontrar el nombre de la especialidad seleccionada
      const selectedSpecialtyObj = specialties.find(s => s.id === selectedSpecialty);
      const specialtyName = selectedSpecialtyObj?.name;
      
      if (!specialtyName) {
        setDoctors([]);
        return;
      }

      const response = await doctorsApi.getAll(1, 50, specialtyName);
      if (response.data) {
        setDoctors(response.data.doctors);
        
        // Limpiar selección de doctor si cambió la especialidad
        if (selectedDoctor) {
          const doctorExists = response.data.doctors.some(d => d.id === selectedDoctor);
          if (!doctorExists) {
            setSelectedDoctor('');
          }
        }
        
        // Si hay un doctor preseleccionado y está en la lista, mantenerlo
        if (preselectedDoctorId) {
          const doctorExists = response.data.doctors.some(d => d.id === preselectedDoctorId);
          if (doctorExists) {
            setSelectedDoctor(preselectedDoctorId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Error al cargar doctores');
      setDoctors([]);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    try {
      setLoadingSlots(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const response = await appointmentsApi.getAvailableSlots(selectedDoctor, dateString);
      
      if (response.data) {
        setAvailableSlots(response.data.slots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Error al cargar horarios disponibles');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      await appointmentsApi.create({
        doctorId: selectedDoctor,
        specialtyId: selectedSpecialty,
        date: dateString,
        time: selectedTime,
        reason: reason || undefined,
      });

      toast.success('¡Cita agendada exitosamente!');
      navigate('/appointments');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al agendar cita';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor);

  // Deshabilitar fechas pasadas
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Agendar Nueva Cita</h1>
          <p className="text-muted-foreground">
            Completa el formulario para reservar tu consulta médica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cita</CardTitle>
            <CardDescription>
              Selecciona la especialidad, doctor, fecha y hora para tu consulta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Specialty */}
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad *</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Selecciona una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor */}
            {selectedSpecialty && (
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor *</Label>
                {doctors.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      No hay doctores disponibles para esta especialidad
                    </p>
                  </div>
                ) : (
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Selecciona un doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {selectedDoctorInfo && (
                  <div className="p-4 bg-muted rounded-lg mt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          Dr. {selectedDoctorInfo.user?.firstName} {selectedDoctorInfo.user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctorInfo.experience} años de experiencia
                        </p>
                        {selectedDoctorInfo.bio && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {selectedDoctorInfo.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date */}
            {selectedDoctor && (
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <div className="border rounded-lg p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={disabledDates}
                    locale={es}
                    className="mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>Horario Disponible *</Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No hay horarios disponibles para esta fecha
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Por favor selecciona otra fecha
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Horarios de Mañana */}
                    {availableSlots.filter(slot => {
                      const hour = parseInt(slot.split(':')[0]);
                      return hour < 12;
                    }).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Mañana</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {availableSlots
                            .filter(slot => parseInt(slot.split(':')[0]) < 12)
                            .map((slot) => (
                              <Button
                                key={slot}
                                type="button"
                                variant={selectedTime === slot ? 'default' : 'outline'}
                                className="h-auto py-3"
                                onClick={() => setSelectedTime(slot)}
                              >
                                {slot}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Horarios de Tarde */}
                    {availableSlots.filter(slot => {
                      const hour = parseInt(slot.split(':')[0]);
                      return hour >= 12;
                    }).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Tarde</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {availableSlots
                            .filter(slot => parseInt(slot.split(':')[0]) >= 12)
                            .map((slot) => (
                              <Button
                                key={slot}
                                type="button"
                                variant={selectedTime === slot ? 'default' : 'outline'}
                                className="h-auto py-3"
                                onClick={() => setSelectedTime(slot)}
                              >
                                {slot}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            {selectedTime && (
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo de la consulta (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe brevemente el motivo de tu consulta..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {/* Submit */}
            {selectedTime && (
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Agendando...' : 'Confirmar Cita'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewAppointment;