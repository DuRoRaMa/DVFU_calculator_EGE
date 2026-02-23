// src/components/calculator/utils/calculatorLogic.js
import * as XLSX from 'xlsx';
/**
 * Фильтрация абитуриентов по заданным критериям
 */
export const filterApplicants = (applicants, filters) => {
  return applicants.filter(applicant => {
    // Фильтр по БВИ
    if (filters.bvi && !applicant.noExams) return false;
    
    // Фильтр по высшему приоритету
    if (filters.highPriority && !applicant.topPriority) return false;
    
    // Фильтр по отсутствию оригиналов
    if (filters.noOriginals && !applicant.hightPriorityNoOriginal) return false;
    
    // Рассчитываем средний балл (для БВИ = 100)
    const avgScore = applicant.noExams ? 100 : applicant.avg_score;
    
    // Фильтр по минимальному баллу
    if (avgScore < filters.minScore) return false;
    
    // Фильтр по максимальному баллу
    if (avgScore > filters.maxScore) return false;
    
    return true;
  });
};

/**
 * Сортировка абитуриентов по выбранному полю
 */
export const sortApplicants = (applicants, sortField, sortDirection) => {
  return [...applicants].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
        
      case 'sumScore':
        aValue = a.sumScore || 0;
        bValue = b.sumScore || 0;
        break;
        
      case 'priority':
        aValue = a.priority || 999;
        bValue = b.priority || 999;
        break;
        
      case 'avg_score':
      default:
        // Для среднего балла учитываем БВИ
        aValue = a.noExams ? 100 : a.avg_score;
        bValue = b.noExams ? 100 : b.avg_score;
        break;
    }
    
    // Для строкового сравнения
    if (typeof aValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Для числового сравнения
    return sortDirection === 'asc' 
      ? aValue - bValue
      : bValue - aValue;
  });
};

/**
 * Расчет результатов по выбранным абитуриентам
 */
export const calculateResults = (selectedApplicants, targetAvgScore) => {
  if (!selectedApplicants.length) {
    return null;
  }
  
  // Правильно рассчитываем с учетом БВИ
  const totalScore = selectedApplicants.reduce((sum, app) => 
    sum + (app.noExams ? 100 : app.avg_score), 0);
  
  const calculatedAvg = totalScore / selectedApplicants.length;
  const deviation = calculatedAvg - targetAvgScore;
  
  // Подсчитываем статистику
  const bviCount = selectedApplicants.filter(app => app.noExams).length;
  const highPriorityCount = selectedApplicants.filter(app => app.topPriority).length;
  const noOriginalCount = selectedApplicants.filter(app => app.hightPriorityNoOriginal).length;
  
  // Распределение по приоритетам
  const priorityDistribution = {
    1: selectedApplicants.filter(a => a.priority === 1).length,
    2: selectedApplicants.filter(a => a.priority === 2).length,
    3: selectedApplicants.filter(a => a.priority === 3).length,
    4: selectedApplicants.filter(a => a.priority === 4).length,
    5: selectedApplicants.filter(a => a.priority === 5).length,
  };
  
  // Средний балл без учета БВИ
  const nonBviApplicants = selectedApplicants.filter(app => !app.noExams);
  const avgWithoutBvi = nonBviApplicants.length > 0
    ? nonBviApplicants.reduce((sum, app) => sum + app.avg_score, 0) / nonBviApplicants.length
    : calculatedAvg;
  
  // Средняя сумма ЕГЭ
  const avgSumScore = selectedApplicants.reduce((sum, app) => 
    sum + (app.sumScore || 0), 0) / selectedApplicants.length;
  
  return {
    calculated_avg_score: calculatedAvg,
    deviation_from_target: deviation,
    is_above_target: deviation >= 0,
    selected_count: selectedApplicants.length,
    
    // Статистика
    bvi_count: bviCount,
    high_priority_count: highPriorityCount,
    no_original_count: noOriginalCount,
    
    // Дополнительные метрики
    avg_sum_score: avgSumScore,
    bvi_percentage: (bviCount / selectedApplicants.length) * 100,
    avg_without_bvi: avgWithoutBvi,
    priority_distribution: priorityDistribution,
    
    // Детализация
    total_sum_score: selectedApplicants.reduce((sum, app) => sum + (app.sumScore || 0), 0),
    has_bvi: bviCount > 0,
    has_high_priority: highPriorityCount > 0,
    has_no_originals: noOriginalCount > 0,
  };
};

/**
 * Проверка валидности выбора
 */
export const validateSelection = (selectedApplicants, admissionPlan, targetAvgScore) => {
  const errors = [];
  const warnings = [];
  
  if (selectedApplicants.length === 0) {
    errors.push('Выберите хотя бы одного абитуриента');
  }
  
  if (selectedApplicants.length > admissionPlan) {
    errors.push(`Превышен план приёма. Выбрано: ${selectedApplicants.length}, доступно: ${admissionPlan}`);
  }
  
  // Проверка дубликатов
  const ids = selectedApplicants.map(app => app.id);
  const uniqueIds = [...new Set(ids)];
  if (ids.length !== uniqueIds.length) {
    errors.push('Обнаружены дублирующиеся абитуриенты');
  }
  
  // Предупреждение о малом количестве БВИ
  const bviCount = selectedApplicants.filter(app => app.noExams).length;
  if (bviCount === 0) {
    warnings.push('В выборке нет абитуриентов с БВИ');
  }
  
  // Предупреждение о низком приоритете
  const highPriorityCount = selectedApplicants.filter(app => app.topPriority).length;
  if (highPriorityCount < selectedApplicants.length * 0.3) {
    warnings.push('Менее 30% абитуриентов с высшим приоритетом');
  }
  
  return { errors, warnings };
};

/**
 * Быстрый выбор: топ по баллам
 */
export const getTopByScore = (applicants, count) => {
  return [...applicants]
    .sort((a, b) => {
      const aScore = a.noExams ? 100 : a.avg_score;
      const bScore = b.noExams ? 100 : b.avg_score;
      return bScore - aScore;
    })
    .slice(0, count);
};

/**
 * Быстрый выбор: только БВИ
 */
export const getOnlyBVI = (applicants, count) => {
  return applicants
    .filter(app => app.noExams)
    .sort((a, b) => (b.noExams ? 100 : b.avg_score) - (a.noExams ? 100 : a.avg_score))
    .slice(0, count);
};

/**
 * Быстрый выбор: только высший приоритет
 */
export const getOnlyHighPriority = (applicants, count) => {
  return applicants
    .filter(app => app.topPriority)
    .sort((a, b) => (b.noExams ? 100 : b.avg_score) - (a.noExams ? 100 : a.avg_score))
    .slice(0, count);
};
/**
 * Экспорт данных в Excel (XLSX)
 */
export const exportToExcel = (selectedApplicants, programCode, programName) => {
  if (!selectedApplicants.length) {
    throw new Error('Нет данных для экспорта');
  }

  // Подготовка данных
  const data = selectedApplicants.map((app, index) => ({
    '№': index + 1,
    'ФИО': app.name,
    'Сумма баллов ЕГЭ': app.sumScore || '',
    'Средний балл': app.noExams ? 100 : app.avg_score.toFixed(2),
    'Заявление БВИ': app.noExams ? 'Да' : 'Нет',
    'Высший приоритет': app.topPriority ? 'Да' : 'Нет',
    'Высший приоритет без оригиналов': app.hightPriorityNoOriginal ? 'Да' : 'Нет',
    'Приоритет заявления': app.priority,
    'ID': app.id,
    'Примечание': app.noExams ? 'БВИ (средний балл = 100)' : ''
  }));

  // Создание рабочей книги
  const wb = XLSX.utils.book_new();
  
  // Основной лист с данными
  const wsData = XLSX.utils.json_to_sheet(data);
  
  // Добавляем заголовок
  const title = [
    [`Расчет среднего балла для программы: ${programName} (${programCode})`],
    [`Дата экспорта: ${new Date().toLocaleString('ru-RU')}`],
    [`Количество абитуриентов: ${selectedApplicants.length}`],
    [''], // Пустая строка для разделения
    ...XLSX.utils.sheet_to_json(wsData, { header: 1 })
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(title);
  
  // Настройка ширины столбцов
  const colWidths = [
    { wch: 5 },   // №
    { wch: 30 },  // ФИО
    { wch: 15 },  // Сумма баллов ЕГЭ
    { wch: 15 },  // Средний балл
    { wch: 15 },  // Заявление БВИ
    { wch: 18 },  // Высший приоритет
    { wch: 28 },  // Высший приоритет без оригиналов
    { wch: 18 },  // Приоритет заявления
    { wch: 10 },  // ID
    { wch: 25 }   // Примечание
  ];
  ws['!cols'] = colWidths;
  
  // Стилизация заголовка
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 9 } });
  
  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(wb, ws, 'Абитуриенты');
  
  // Лист со статистикой
  const statsData = calculateResults(selectedApplicants, 0); // targetAvgScore не нужен для статистики
  
  const statsRows = [
    ['СТАТИСТИКА ВЫБОРКИ'],
    [''],
    ['Показатель', 'Значение'],
    ['Всего абитуриентов', statsData.selected_count],
    ['Абитуриентов с БВИ', `${statsData.bvi_count} (${statsData.bvi_percentage.toFixed(1)}%)`],
    ['С высшим приоритетом', statsData.high_priority_count],
    ['Без оригиналов', statsData.no_original_count],
    ['Средний балл выборки', statsData.calculated_avg_score.toFixed(2)],
    ['Средняя сумма ЕГЭ', statsData.avg_sum_score.toFixed(2)],
    [''],
    ['РАСПРЕДЕЛЕНИЕ ПО ПРИОРИТЕТАМ'],
    ['Приоритет 1', statsData.priority_distribution[1]],
    ['Приоритет 2', statsData.priority_distribution[2]],
    ['Приоритет 3', statsData.priority_distribution[3]],
    ['Приоритет 4', statsData.priority_distribution[4] || 0],
    ['Приоритет 5', statsData.priority_distribution[5] || 0],
  ];
  
  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
  wsStats['!cols'] = [{ wch: 25 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(wb, wsStats, 'Статистика');
  
  // Лист с расчетами
  const calculationRows = [
    ['РАСЧЕТ СРЕДНЕГО БАЛЛА'],
    [''],
    ['Описание расчета', 'Значение', 'Формула'],
    ['Сумма всех баллов', statsData.calculated_avg_score * statsData.selected_count, '=СУММ(Данные!D6:D...)'],
    ['Количество абитуриентов', statsData.selected_count, '=СЧЁТ(Данные!A6:A...)'],
    ['Средний балл', statsData.calculated_avg_score.toFixed(2), '=B4/B5'],
    [''],
    ['Примечание:', 'Для БВИ абитуриентов средний балл = 100'],
  ];
  
  const wsCalc = XLSX.utils.aoa_to_sheet(calculationRows);
  wsCalc['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }];
  
  XLSX.utils.book_append_sheet(wb, wsCalc, 'Расчеты');
  
  // Генерация файла
  const fileName = `расчет_${programCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Экспорт данных в CSV
 */
export const exportToCSV = (selectedApplicants, programCode) => {
  const headers = [
    'ФИО',
    'Сумма ЕГЭ',
    'Средний балл',
    'БВИ',
    'Высший приоритет',
    'Без оригиналов',
    'Приоритет',
    'ID'
  ];
  
  const data = selectedApplicants.map(app => [
    `"${app.name}"`, // Экранируем кавычки
    app.sumScore || '',
    app.noExams ? 100 : app.avg_score.toFixed(2),
    app.noExams ? 'Да' : 'Нет',
    app.topPriority ? 'Да' : 'Нет',
    app.hightPriorityNoOriginal ? 'Да' : 'Нет',
    app.priority,
    app.id
  ]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `расчет_${programCode}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Рассчет среднего балла для абитуриента с учетом БВИ
 */
export const getApplicantAverageScore = (applicant) => {
  return applicant.noExams ? 100 : applicant.avg_score;
};

/**
 * Получить цвет для отображения балла
 */
export const getScoreColor = (score) => {
  if (score >= 90) return 'success.main';
  if (score >= 75) return 'primary.main';
  return 'error.main';
};

/**
 * Получить цвет для границы карточки
 */
export const getBorderColor = (applicant) => {
  const score = getApplicantAverageScore(applicant);
  if (score >= 90) return 'success.main';
  if (score >= 75) return 'primary.main';
  return 'warning.main';
};

export default {
  filterApplicants,
  sortApplicants,
  calculateResults,
  validateSelection,
  getTopByScore,
  getOnlyBVI,
  getOnlyHighPriority,
  exportToCSV,
  getApplicantAverageScore,
  getScoreColor,
  getBorderColor
};