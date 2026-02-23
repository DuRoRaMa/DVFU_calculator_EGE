import axios from 'axios';

// Настройка базового URL
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Программы
export const getPrograms = () => api.get('/programs/');
export const getProgram = (id) => api.get(`/programs/${id}/`);

// Расчет
export const calculateAverage = (programId, applicants) => 
  api.post('/calculate/', { program_id: programId, applicants });

// Симуляция
export const simulateScenario = (programId, baseApplicants, changes) =>
  api.post('/calculate/scenario/', {
    program_id: programId,
    base_applicants: baseApplicants,
    changes
  });

// Валидация
export const validateSelection = (programId, applicants) =>
  api.post('/validate-selection/', {
    program_id: programId,
    applicants
  });

// Рекомендации
export const getRecommendations = (programId, data) =>
  api.post('/recommendations/', { program_id: programId, ...data });

export default api;