import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/ege-calc-backend/api';

export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const getCurrentUserFromStorage = () => {
  const rawUser = localStorage.getItem('currentUser');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const hasAuthTokens = () => {
  return Boolean(getAccessToken() || getRefreshToken());
};

export const isAdminUser = (user) => {
  return Boolean(user?.is_staff || user?.is_superuser);
};

export const saveAuthTokens = ({ access, refresh, user }) => {
  if (access) {
    localStorage.setItem('accessToken', access);
  }

  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  window.dispatchEvent(new Event('auth:login'));
};

export const saveCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');

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
        failedQueue.push({
          resolve,
          reject,
        });
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
export const getPrograms = (params = {}) => {
  return api.get('/programs/', {
    params,
  });
};

export const getProgram = (id) => api.get(`/programs/${id}/`);

export const getProgramByCode = (code) => {
  return api.get(`/programs/by-code/${encodeURIComponent(code)}/`);
};

export const getSubjects = () => api.get('/subjects/');

// Мониторинг / заявления
export const getDirectionStats = () => api.get('/directions/stats/');

export const getDirectionApplicants = (directionCode) => {
  return api.get(`/directions/${encodeURIComponent(directionCode)}/applicants/`);
};

export const getUniversityStats = () => api.get('/admin/university-stats/');

// Импорт
export const getImportStatus = () => api.get('/import/status/');

export const getImportSettings = () => api.get('/admin/import/settings/');

export const updateImportSettings = (data) => {
  const payload = {
    ...data,
  };

  if (!payload.service_password) {
    delete payload.service_password;
  }

  return api.patch('/admin/import/settings/', payload);
};

export const runImport = () => api.post('/admin/import/run/');

export const testImportConnection = () => api.post('/admin/import/test-connection/');

// Расчет.
// Сейчас CalculatorPage считает локально, но оставляем совместимые функции
// для будущего перехода на backend-расчет.
export const calculateAverage = (directionCode, applicationIds = []) => {
  return api.post('/calculate/', {
    direction_code: directionCode,
    application_ids: applicationIds,
  });
};

export const simulateScenario = (
  directionCode,
  baseApplicationIds = [],
  addApplicationIds = [],
  removeApplicationIds = []
) => {
  return api.post('/calculate/scenario/', {
    direction_code: directionCode,
    base_application_ids: baseApplicationIds,
    add_application_ids: addApplicationIds,
    remove_application_ids: removeApplicationIds,
  });
};

export const validateSelection = (directionCode, applicationIds = []) => {
  return api.post('/validate-selection/', {
    direction_code: directionCode,
    application_ids: applicationIds,
  });
};

// Рекомендации пока заглушка на backend.
// Не отправляем старые поля admission_plan/categories, чтобы serializer не вернул 400.
export const getRecommendations = (_programId, data = {}) => {
  return api.post('/recommendations/', {
    direction_code: data.direction_code || '',
    application_ids: data.application_ids || [],
  });
};
export const getUniversityVppAverageDynamics = (params = {}) => {
  return api.get('/admin/vpp-average-dynamics/university/', {
    params,
  });
};

export const getDirectionVppAverageDynamics = (directionCode, params = {}) => {
  return api.get(
    `/admin/vpp-average-dynamics/directions/${encodeURIComponent(directionCode)}/`,
    {
      params,
    }
  );
};
export default api;