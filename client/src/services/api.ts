import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Tipos
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  doctorInfo?: DoctorInfo;
}

export interface DoctorInfo {
  id: string;
  userId: string;
  license: string;
  specialties: string[];
  experience: number;
  consultationFee: number;
  bio?: string;
  isAvailable: boolean;
  schedules?: DoctorSchedule[];
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
  createdAt: string;
  patient?: User;
  doctor?: DoctorInfo & { user?: User };
  specialty?: Specialty;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// ============================================
// AUTHENTICATION API
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      { email, password }
    );
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    role: 'PATIENT' | 'DOCTOR' = 'PATIENT'
  ) => {
    const { data } = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      { email, password, firstName, lastName, phone, role }
    );
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    if (data.data?.user) {
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await apiClient.put<ApiResponse<null>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

// ============================================
// USERS API
// ============================================

export const usersApi = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/users', {
      params: { page, limit, search },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>(`/users/${id}`);
    return data;
  },

  update: async (id: string, userData: Partial<User>) => {
    const { data } = await apiClient.put<ApiResponse<{ user: User }>>(`/users/${id}`, userData);
    return data;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const { data} = await apiClient.put<ApiResponse<{ user: User }>>(`/users/${id}/status`, {
      isActive,
    });
    return data;
  },

  getAppointments: async (id: string, page = 1, limit = 10, status?: string) => {
    const { data } = await apiClient.get<PaginatedResponse<Appointment>>(
      `/users/${id}/appointments`,
      {
        params: { page, limit, status },
      }
    );
    return data;
  },
};

// ============================================
// DOCTORS API
// ============================================

export const doctorsApi = {
  getAll: async (page = 1, limit = 10, specialty?: string, search = '') => {
    const { data } = await apiClient.get<PaginatedResponse<DoctorInfo>>('/doctors', {
      params: { page, limit, specialty, search },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ doctor: DoctorInfo & { user: User } }>>(
      `/doctors/${id}`
    );
    return data;
  },

  createInfo: async (doctorData: {
    license: string;
    specialties: string[];
    experience: number;
    consultationFee: number;
    bio?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ doctorInfo: DoctorInfo }>>(
      '/doctors/info',
      doctorData
    );
    return data;
  },

  updateInfo: async (doctorData: Partial<DoctorInfo>) => {
    const { data } = await apiClient.put<ApiResponse<{ doctorInfo: DoctorInfo }>>(
      '/doctors/info',
      doctorData
    );
    return data;
  },

  createSchedule: async (scheduleData: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ schedule: DoctorSchedule }>>(
      '/doctors/schedules',
      scheduleData
    );
    return data;
  },

  getSchedules: async () => {
    const { data } = await apiClient.get<ApiResponse<{ schedules: DoctorSchedule[] }>>(
      '/doctors/schedules'
    );
    return data;
  },

  updateSchedule: async (id: string, scheduleData: Partial<DoctorSchedule>) => {
    const { data } = await apiClient.put<ApiResponse<{ schedule: DoctorSchedule }>>(
      `/doctors/schedules/${id}`,
      scheduleData
    );
    return data;
  },

  deleteSchedule: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/doctors/schedules/${id}`);
    return data;
  },
};

// ============================================
// APPOINTMENTS API
// ============================================

export const appointmentsApi = {
  create: async (appointmentData: {
    doctorId: string;
    specialtyId: string;
    date: string;
    time: string;
    reason?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ appointment: Appointment }>>(
      '/appointments',
      appointmentData
    );
    return data;
  },

  getAll: async (page = 1, limit = 10, status?: string) => {
    const { data } = await apiClient.get<PaginatedResponse<Appointment>>('/appointments', {
      params: { page, limit, status },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ appointment: Appointment }>>(
      `/appointments/${id}`
    );
    return data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const { data } = await apiClient.put<ApiResponse<{ appointment: Appointment }>>(
      `/appointments/${id}/status`,
      { status, notes }
    );
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/appointments/${id}`);
    return data;
  },

  getAvailableSlots: async (doctorId: string, date: string) => {
    const { data } = await apiClient.get<ApiResponse<{ slots: string[] }>>(
      '/appointments/available-slots',
      {
        params: { doctorId, date },
      }
    );
    return data;
  },
};

// ============================================
// SPECIALTIES API
// ============================================

export const specialtiesApi = {
  getAll: async (page = 1, limit = 50, search = '') => {
    const { data } = await apiClient.get<PaginatedResponse<Specialty>>('/specialties', {
      params: { page, limit, search },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ specialty: Specialty }>>(
      `/specialties/${id}`
    );
    return data;
  },

  create: async (specialtyData: { name: string; description?: string }) => {
    const { data } = await apiClient.post<ApiResponse<{ specialty: Specialty }>>(
      '/specialties',
      specialtyData
    );
    return data;
  },

  update: async (id: string, specialtyData: Partial<Specialty>) => {
    const { data } = await apiClient.put<ApiResponse<{ specialty: Specialty }>>(
      `/specialties/${id}`,
      specialtyData
    );
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/specialties/${id}`);
    return data;
  },

  getDoctors: async (id: string, page = 1, limit = 10) => {
    const { data } = await apiClient.get<PaginatedResponse<DoctorInfo>>(
      `/specialties/${id}/doctors`,
      {
        params: { page, limit },
      }
    );
    return data;
  },
};

export default apiClient;
