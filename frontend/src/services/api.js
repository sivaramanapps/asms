// API service for backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.data.accessToken);
    return data;
  }

  async logout() {
    this.clearToken();
  }

  // ... rest of the methods stay the same
  async getWorkers(companyId) {
    return this.request(`/api/workers/company/${companyId}`);
  }

  async clockIn(workerId, companyId, notes = '') {
    return this.request(`/api/attendance/clock-in/${workerId}`, {
      method: 'POST',
      body: JSON.stringify({ companyId, notes }),
    });
  }

  async clockOut(workerId, companyId, notes = '') {
    return this.request(`/api/attendance/clock-out/${workerId}`, {
      method: 'POST',
      body: JSON.stringify({ companyId, notes }),
    });
  }

  async getTodayAttendance(companyId) {
    return this.request(`/api/attendance/today/${companyId}`);
  }

  async createWorkLog(workLogData) {
    return this.request('/api/work-logs/entry', {
      method: 'POST',
      body: JSON.stringify(workLogData),
    });
  }

  async getWorkLogsByDate(companyId, date) {
    return this.request(`/api/work-logs/company/${companyId}/date/${date}`);
  }
}

export default new ApiService();