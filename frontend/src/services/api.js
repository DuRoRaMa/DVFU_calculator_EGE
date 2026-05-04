import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const hasAuthTokens = () => {
  return Boolean(getAccessToken() || getRefreshToken());
};

export const saveAuthTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem('accessToken', access);
  }

  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }

  window.dispatchEvent(new Event('auth:login'));
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.dispatchEvent(new Event('auth:logout'));
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = (username, password) => {
  return axios.post(`${API_BASE_URL}/token/`, {
    username,
    password,
  });
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = refreshResponse.data.access;
      const newRefreshToken = refreshResponse.data.refresh;

      saveAuthTokens({
        access: newAccessToken,
        refresh: newRefreshToken,
      });

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthTokens();
      redirectToLogin();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Пользователь
export const getMe = () => api.get('/me/');

// Программы
export const getPrograms = () => api.get('/programs/');
export const getProgram = (id) => api.get(`/programs/${id}/`);

// Мониторинг
export const getDirectionStats = () => api.get('/directions/stats/');

export const getDirectionApplicants = (directionCode) => {
  return api.get(`/directions/${encodeURIComponent(directionCode)}/applicants/`);
};

export const getImportStatus = () => api.get('/import/status/');

// Админ
export const getUniversityStats = () => api.get('/admin/university-stats/');
export const getImportSettings = () => api.get('/admin/import/settings/');
export const updateImportSettings = (data) => api.patch('/admin/import/settings/', data);
export const runImport = () => api.post('/admin/import/run/');

// Расчет
export const calculateAverage = (programId, applicants) => {
  return api.post('/calculate/', {
    program_id: programId,
    applicants,
  });
};

// Симуляция
export const simulateScenario = (programId, baseApplicants, changes) => {
  return api.post('/calculate/scenario/', {
    program_id: programId,
    base_applicants: baseApplicants,
    changes,
  });
};

// Валидация
export const validateSelection = (programId, applicants) => {
  return api.post('/validate-selection/', {
    program_id: programId,
    applicants,
  });
};

// Рекомендации
export const getRecommendations = (programId, data) => {
  return api.post('/recommendations/', {
    program_id: programId,
    ...data,
  });
};

export default api;
