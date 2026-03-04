import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsApi, specialtiesApi, DoctorInfo, Specialty } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<(DoctorInfo & { user?: any })[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm, selectedSpecialty]);

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

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const specialty = selectedSpecialty !== 'all' ? selectedSpecialty : undefined;
      const response = await doctorsApi.getAll(1, 50, specialty, searchTerm);
      
      if (response.data) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Error al cargar doctores');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Especialistas Médicos</h1>
          <p className="text-muted-foreground">
            Encuentra al médico adecuado para tu consulta
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.name}>
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando especialistas...</p>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron especialistas</h3>
            <p className="text-muted-foreground text-center">
              Intenta con otros filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </CardTitle>
                    <CardDescription>
                      Licencia: {doctor.license}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Specialties */}
                  <div>
                    <p className="text-sm font-medium mb-2">Especialidades:</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{doctor.experience} años de experiencia</span>
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {doctor.bio}
                    </p>
                  )}

                  {/* Schedule */}
                  {doctor.schedules && doctor.schedules.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Horarios de atención:
                      </p>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        {doctor.schedules
                          .filter((s) => s.isActive)
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between py-1 px-2 rounded bg-muted/50">
                              <span className="font-medium">{getDayName(schedule.dayOfWeek)}</span>
                              <span className="text-muted-foreground">{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/new-appointment', { state: { doctorId: doctor.id } })}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Doctors;