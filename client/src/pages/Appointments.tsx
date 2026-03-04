import { useEffect, useState } from 'react';
import { appointmentsApi, Appointment } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Stethoscope, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { parseLocalDate } from '@/lib/dateUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsApi.getAll(1, 100);
      if (response.data) {
        // Ordenar por fecha descendente
        const sorted = response.data.appointments.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAppointments(sorted);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentsApi.cancel(appointmentId);
      toast.success('Cita cancelada exitosamente');
      fetchAppointments(); // Recargar lista
      setCancellingId(null);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cancelar cita';
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      SCHEDULED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock, text: 'Programada' },
      CONFIRMED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle, text: 'Confirmada' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertCircle, text: 'En Progreso' },
      COMPLETED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: CheckCircle, text: 'Completada' },
      CANCELLED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle, text: 'Cancelada' },
      NO_SHOW: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle, text: 'No Asistió' },
    };
    return configs[status as keyof typeof configs] || configs.SCHEDULED;
  };

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentDate = parseLocalDate(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = appointmentDate < today;
    const canCancelStatuses = ['SCHEDULED', 'CONFIRMED'];
    return !isPast && canCancelStatuses.includes(appointment.status);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Citas Médicas</h1>
        <p className="text-muted-foreground">
          Historial completo de tus consultas
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes citas registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agendando tu primera consulta médica
            </p>
            <Button onClick={() => window.location.href = '/new-appointment'}>
              Agendar Cita
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const statusConfig = getStatusBadge(appointment.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {appointment.specialty?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Fecha</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseLocalDate(appointment.date), 'EEEE, dd MMMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Hora</p>
                          <p className="text-sm text-muted-foreground">{appointment.time}</p>
                        </div>
                      </div>
                    </div>

                    {appointment.reason && (
                      <div>
                        <p className="text-sm font-medium mb-1">Motivo de consulta:</p>
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notas:</p>
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}

                    {canCancelAppointment(appointment) && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancellingId(appointment.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar Cita
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancellingId} onOpenChange={() => setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita médica. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellingId && handleCancelAppointment(cancellingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Appointments;