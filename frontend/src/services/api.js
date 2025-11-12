import axios from 'axios';

const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const resp = error.response;
      if (
        resp &&
        resp.headers &&
        resp.headers['content-type'] &&
        resp.headers['content-type'].includes('application/problem+json')
      ) {
        // ProblemDetail format: { type, title, status, detail }
        const pd = resp.data || {};
        error.userMessage = pd.title || 'An error occurred';
      } else if (resp && resp.data) {
        // fallback to common patterns
        error.userMessage = resp.data.message || resp.data.title || error.message;
      } else {
        error.userMessage = error.message;
      }
    } catch {
      error.userMessage = error.message;
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
};

export const appointmentAPI = {
  listForPatient: (patientId) => apiClient.get(`/patients/${patientId}/appointments`),

  listForClinic: (clinicId, date, when) =>
    when === 'upcoming'
      ? apiClient.get(`/clinics/${clinicId}/appointments`)
      : apiClient.get(`/clinics/${clinicId}/appointments`, { params: { date } }),

  listForSpecialist: (specialistId, date) =>
    apiClient.get(`/specialists/${specialistId}/appointments`, { params: { date } }),

  listForDoctor: (doctorId, date) =>
    apiClient.get(`/doctors/${doctorId}/appointments`, { params: { date } }),

  // Book/cancel
  book: (patientId, payload) => apiClient.post(`/patients/${patientId}/appointments`, payload),
  cancel: (appointmentId) => apiClient.delete(`/appointments/${appointmentId}`),

  // Patient reschedule
  reschedule: (appointmentId, payload) =>
    apiClient.patch(`/appointments/${appointmentId}/reschedule`, payload),

  // Staff reschedule
  staffReschedule: (appointmentId, payload) =>
    apiClient.patch(`/staff/appointments/${appointmentId}/reschedule`, payload),
  
  // Staff walk-in
  staffWalkIn: (payload) => apiClient.post(`/staff/appointments/walk-in`, payload),

  // Optional staff cancel
  staffCancel: (appointmentId) => apiClient.delete(`/staff/appointments/${appointmentId}`),

  updateStatus: (appointmentId, status) =>
    apiClient.patch(`/appointments/${appointmentId}/status`, { status }),
};

export const patientAPI = {
  medicalRecords: (patientId) => apiClient.get(`/patients/${patientId}/medical-records`),
  getMedicalRecord: (patientId, recordId) =>
    apiClient.get(`/patients/${patientId}/medical-records/${recordId}`),
};

export const queueAPI = {
  getPatientStatus: (patientId) => apiClient.get(`/patients/${patientId}/queue-status`),
  checkIn: (appointmentId) => apiClient.post(`/patients/appointments/${appointmentId}/check-in`),
  staffStart: (clinicId) => apiClient.post('/staff/queue/start', null, { params: { clinicId } }),
  staffPause: (clinicId) => apiClient.post('/staff/queue/pause', null, { params: { clinicId } }),
  staffNext: (clinicId) => apiClient.post('/staff/queue/next', null, { params: { clinicId } }),
  staffMarkStatus: (queueNumber, payload) =>
    apiClient.patch(`/staff/queue/${queueNumber}/status`, payload),
  staffFastTrack: (clinicId, queueNumber) =>
    apiClient.post(`/staff/queue/${queueNumber}/fast-track`, null, { params: { clinicId } }),
  staffQueueStatus: (clinicId) => apiClient.get('/staff/queue/status', { params: { clinicId } }),
  staffDailyReport: (clinicId, date) =>
    apiClient.get('/staff/reports/daily', { params: { clinicId, date } }),
  staffQueueEntries: (clinicId) => apiClient.get('/staff/queue/entries', { params: { clinicId } }),
};

export const clinicAPI = {
  update: (clinicId, data) => apiClient.put(`/admin/clinics/${clinicId}`, data),
  updateSlotInterval: (clinicId, minutes) =>
    apiClient.put(`/admin/clinics/${clinicId}/slot-interval`, { minutes }),
  updateHours: (clinicId, hours) => apiClient.put(`/admin/clinics/${clinicId}/hours`, hours),
  getAll: () => apiClient.get('/admin/clinics'),
};

export const specialistAPI = {
  getAll: () => apiClient.get('/specialists'),
  getSchedule: (id) => apiClient.get(`/specialists/${id}/schedule`),
};

export const doctorAPI = {
  getSchedule: (id) => apiClient.get(`/doctors/${id}/schedule`),
  updateSchedule: (id, data) => apiClient.put(`/doctors/${id}/schedule`, data),
  getAll: () => apiClient.get('/admin/doctors'),
  postNotes: (doctorId, payload) =>
    apiClient.post(`/doctors/${doctorId}/appointments/notes`, payload),
};

export const statsAPI = {
  getOverview: () => apiClient.get('/admin/stats'),
};

export const adminAPI = {
  createUser: (payload) => apiClient.post('/admin/users', payload),
  updateUser: (userId, payload) => apiClient.put(`/admin/users/${userId}`, payload),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  assignRole: (userId, payload) => apiClient.post(`/admin/users/${userId}/roles`, payload),
  removeRole: (userId, role) =>
    apiClient.delete(`/admin/users/${userId}/roles`, { data: { role } }),
  listUsers: () => apiClient.get('/admin/users'),
};

export const maintenanceAPI = {
  listBackups: () => apiClient.get('/admin/maintenance/backups'),
  createBackup: () => apiClient.post('/admin/maintenance/backup'),
  restoreBackup: (backupId) => apiClient.post('/admin/maintenance/restore', { backupId }),
};

export default apiClient;
