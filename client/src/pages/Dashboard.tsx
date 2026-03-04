import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { appointmentsApi, Appointment } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Stethoscope, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { parseLocalDate } from '@/lib/dateUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las citas del usuario
      const allAppointmentsResponse = await appointmentsApi.getAll(1, 100);
      const allAppointments = allAppointmentsResponse.data?.appointments || [];

      // Calcular estadísticas
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = allAppointments.filter(
        (apt) =>
          parseLocalDate(apt.date) >= today &&
          ['SCHEDULED', 'CONFIRMED'].includes(apt.status)
      );

      const completed = allAppointments.filter((apt) => apt.status === 'COMPLETED');

      setStats({
        totalAppointments: allAppointments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
      });

      // Obtener próximas 3 citas
      setUpcomingAppointments(upcoming.slice(0, 3));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      SCHEDULED: 'Programada',
      CONFIRMED: 'Confirmada',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No Asistió',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-white/90 mb-6">
          Gestiona tus citas médicas de forma fácil y rápida
        </p>
        <Button 
          size="lg" 
          variant="secondary"
          onClick={() => navigate('/new-appointment')}
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Agendar Nueva Cita
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Citas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Citas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximas Citas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Citas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completadas
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Consultas realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Próximas Citas</CardTitle>
              <CardDescription>
                Tus citas médicas programadas
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/appointments')}>
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes citas programadas</h3>
              <p className="text-muted-foreground mb-4">
                Agenda tu primera cita con nuestros especialistas
              </p>
              <Button onClick={() => navigate('/new-appointment')}>
                <Plus className="w-4 h-4 mr-2" />
                Agendar Cita
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/appointments')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {appointment.specialty?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground ml-15">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseLocalDate(appointment.date), 'PPP', { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.time}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/doctors')}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Buscar Especialistas</CardTitle>
                <CardDescription>
                  Encuentra el médico adecuado para ti
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/appointments')}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Historial de Citas</CardTitle>
                <CardDescription>
                  Revisa tus consultas anteriores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;