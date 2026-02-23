// src/utils/mockApplicants.js
export const mockApplicants = [
  {
    id: 1,
    name: 'Иванов Иван Иванович',
    sumScore: 285, // Сумма баллов ЕГЭ (новое поле)
    avg_score: 95.0, // Средний балл (уже есть)
    noExams: true, // Заявление БВИ (новое)
    topPriority: true, // Высший приоритет (новое)
    hightPriorityNoOriginal: false, // Высший приоритет без оригиналов (новое)
    
  },
  {
    id: 2,
    name: 'Петров Петр Петрович',
    sumScore: 270,
    avg_score: 90.0,
    noExams: false,
    topPriority: false,
    hightPriorityNoOriginal: true,
    
  }
];

export const smallMockApplicants = mockApplicants.slice(0, 5);