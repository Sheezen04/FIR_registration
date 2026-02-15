import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
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

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
  role: 'CITIZEN' | 'POLICE' | 'ADMIN';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'CITIZEN' | 'POLICE' | 'ADMIN';
  station?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: 'CITIZEN' | 'POLICE' | 'ADMIN';
  station?: string;
}

export interface FIRRequest {
  incidentType: string;
  description: string;
  dateTime: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  location: string;
  evidenceFiles?: string[];
}

export interface FIRResponse {
  id: number;
  firNumber: string;
  complainantName: string;
  complainantEmail: string;
  incidentType: string;
  description: string;
  dateTime: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  location: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_INVESTIGATION' | 'IN_PROGRESS' | 'CLOSED';
  assignedStation?: string;
  assignedOfficer?: string;
  remarks?: string;
  actionNotes?: string[];
  evidenceFiles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFIRStatusRequest {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_INVESTIGATION' | 'IN_PROGRESS' | 'CLOSED';
  remarks?: string;
  actionNote?: string;
  assignedStation?: string;
  assignedOfficer?: string;
  assignedOfficerId?: number;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: 'CITIZEN' | 'POLICE' | 'ADMIN';
  station?: string;
}

export interface DashboardStats {
  totalFirs: number;
  pendingFirs: number;
  approvedFirs: number;
  rejectedFirs: number;
  underInvestigationFirs: number;
  inProgressFirs: number;
  closedFirs: number;
  emergencyFirs: number;
  totalUsers: number;
  policeOfficers: number;
  firsByIncidentType: Record<string, number>;
  firsByPriority: Record<string, number>;
  firsByStatus: Record<string, number>;
}

// Paginated Response Types
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export interface FIRFilterParams {
  page?: number;
  size?: number;
  search?: string;
  complainant?: string;
  status?: string;
  priority?: string;
  incidentType?: string;
  dateFilter?: string;
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
};

// FIR API
export const firApi = {
  create: (data: FIRRequest) => api.post<FIRResponse>('/fir', data),
  getAll: () => api.get<FIRResponse[]>('/fir'),
  getPaginated: (params: FIRFilterParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.complainant) queryParams.append('complainant', params.complainant);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params.priority && params.priority !== 'ALL') queryParams.append('priority', params.priority);
    if (params.incidentType && params.incidentType !== 'ALL') queryParams.append('incidentType', params.incidentType);
    if (params.dateFilter) queryParams.append('dateFilter', params.dateFilter);
    return api.get<PagedResponse<FIRResponse>>(`/fir/paginated?${queryParams.toString()}`);
  },
  getMy: () => api.get<FIRResponse[]>('/fir/my'),
  getById: (id: number) => api.get<FIRResponse>(`/fir/${id}`),
  getByNumber: (firNumber: string) => api.get<FIRResponse>(`/fir/number/${firNumber}`),
  getByStatus: (status: string) => api.get<FIRResponse[]>(`/fir/status/${status}`),
  getByOfficer: (officerId: number) => api.get<FIRResponse[]>(`/fir/officer/${officerId}`),
  getByStation: (station: string) => api.get<FIRResponse[]>(`/fir/station/${station}`),
  updateStatus: (id: number, data: UpdateFIRStatusRequest) => api.patch<FIRResponse>(`/fir/${id}/status`, data),
  getStats: () => api.get<DashboardStats>('/fir/stats'),
};

// User API (Admin only)
export const userApi = {
  getAll: () => api.get<UserResponse[]>('/admin/users'),
  getByRole: (role: string) => api.get<UserResponse[]>(`/admin/users/role/${role}`),
  getById: (id: number) => api.get<UserResponse>(`/admin/users/${id}`),
  create: (data: { name: string; email: string; password?: string; role: string; station?: string }) =>
    api.post<UserResponse>('/admin/users', data),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
  getPoliceOfficers: () => api.get<UserResponse[]>('/admin/users/police'),
};

// File Upload API
export const fileApi = {
  upload: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post<string[]>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getDownloadUrl: (filePath: string) => {
    // Extract filename from path like "uploads/filename.jpg"
    const filename = filePath.replace('uploads/', '');
    return `/api/files/download/${filename}`;
  },
};

export default api;
