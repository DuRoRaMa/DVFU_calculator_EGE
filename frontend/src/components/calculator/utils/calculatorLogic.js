import * as XLSX from 'xlsx';

export const getApplicantAverageScore = (applicant) => {
  return applicant.noExams ? 100 : Number(applicant.avg_score || 0);
};

export const filterApplicants = (applicants, filters) => {
  const minScore = Number(filters.minScore ?? 0);
  const maxScore = Number(filters.maxScore ?? 100);

  return applicants.filter((applicant) => {
    if (filters.bvi && !applicant.noExams) {
      return false;
    }

    if (filters.highPriority && !applicant.topPriority) {
      return false;
    }

    if (filters.noOriginals && !applicant.hightPriorityNoOriginal) {
      return false;
    }

    const avgScore = getApplicantAverageScore(applicant);

    if (!Number.isNaN(minScore) && avgScore < minScore) {
      return false;
    }

    if (!Number.isNaN(maxScore) && avgScore > maxScore) {
      return false;
    }

    return true;
  });
};

export const sortApplicants = (applicants, sortField, sortDirection) => {
  return [...applicants].sort((a, b) => {
    let aValue;
    let bValue;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;

      case 'sumScore':
        aValue = Number(a.sumScore || 0);
        bValue = Number(b.sumScore || 0);
        break;

      case 'avg_score':
      default:
        aValue = getApplicantAverageScore(a);
        bValue = getApplicantAverageScore(b);
        break;
    }

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? aValue - bValue
      : bValue - aValue;
  });
};

export const calculateResults = (selectedApplicants, targetAvgScore) => {
  if (!selectedApplicants.length) {
    return null;
  }

  const totalScore = selectedApplicants.reduce(
    (sum, applicant) => sum + getApplicantAverageScore(applicant),
    0
  );

  const calculatedAvg = totalScore / selectedApplicants.length;
  const deviation = calculatedAvg - Number(targetAvgScore || 0);

  const bviCount = selectedApplicants.filter((applicant) => applicant.noExams).length;
  const highPriorityCount = selectedApplicants.filter((applicant) => applicant.topPriority).length;

  const nonBviApplicants = selectedApplicants.filter((applicant) => !applicant.noExams);
  const avgWithoutBvi = nonBviApplicants.length > 0
    ? nonBviApplicants.reduce((sum, applicant) => sum + Number(applicant.avg_score || 0), 0)
      / nonBviApplicants.length
    : calculatedAvg;

  const totalSumScore = selectedApplicants.reduce(
    (sum, applicant) => sum + Number(applicant.sumScore || 0),
    0
  );

  const avgSumScore = totalSumScore / selectedApplicants.length;

  return {
    calculated_avg_score: calculatedAvg,
    deviation_from_target: deviation,
    is_above_target: deviation >= 0,

    selected_count: selectedApplicants.length,
    bvi_count: bviCount,
    high_priority_count: highPriorityCount,

    avg_sum_score: avgSumScore,
    total_sum_score: totalSumScore,

    bvi_percentage: (bviCount / selectedApplicants.length) * 100,
    avg_without_bvi: avgWithoutBvi,

    has_bvi: bviCount > 0,
    has_high_priority: highPriorityCount > 0,
  };
};

export const validateSelection = (
  selectedApplicants,
  admissionPlan
) => {
  const errors = [];
  const warnings = [];

  if (selectedApplicants.length === 0) {
    errors.push('Выберите хотя бы одного абитуриента');
  }

  if (selectedApplicants.length > admissionPlan) {
    errors.push(
      `Превышен план приёма. Выбрано: ${selectedApplicants.length}, доступно: ${admissionPlan}`
    );
  }

  const ids = selectedApplicants.map((applicant) => applicant.id);
  const uniqueIds = [...new Set(ids)];

  if (ids.length !== uniqueIds.length) {
    errors.push('Обнаружены дублирующиеся абитуриенты');
  }

  const highPriorityCount = selectedApplicants.filter((applicant) => applicant.topPriority).length;

  if (
    selectedApplicants.length > 0
    && highPriorityCount < selectedApplicants.length * 0.3
  ) {
    warnings.push('Менее 30% абитуриентов с высшим приоритетом');
  }

  return {
    errors,
    warnings,
  };
};

export const getTopByScore = (applicants, count) => {
  return [...applicants]
    .sort((a, b) => getApplicantAverageScore(b) - getApplicantAverageScore(a))
    .slice(0, count);
};

export const getOnlyBVI = (applicants, count) => {
  return applicants
    .filter((applicant) => applicant.noExams)
    .sort((a, b) => getApplicantAverageScore(b) - getApplicantAverageScore(a))
    .slice(0, count);
};

export const getOnlyHighPriority = (applicants, count) => {
  return applicants
    .filter((applicant) => applicant.topPriority)
    .sort((a, b) => getApplicantAverageScore(b) - getApplicantAverageScore(a))
    .slice(0, count);
};

export const exportToExcel = (selectedApplicants, programCode, programName) => {
  if (!selectedApplicants.length) {
    throw new Error('Нет данных для экспорта');
  }

  const data = selectedApplicants.map((applicant, index) => ({
    '№': index + 1,
    'ФИО': applicant.name,
    'Сумма баллов': applicant.sumScore || '',
    'Средний балл': getApplicantAverageScore(applicant).toFixed(2),
    'БВИ': applicant.noExams ? 'Да' : 'Нет',
    'Высший приоритет': applicant.topPriority ? 'Да' : 'Нет',
    'Согласие': applicant.approval ? 'Да' : 'Нет',
    'ID': applicant.id,
  }));

  const wb = XLSX.utils.book_new();
  const wsData = XLSX.utils.json_to_sheet(data);

  const title = [
    [`Расчет среднего балла выборки: ${programName} (${programCode})`],
    [`Дата экспорта: ${new Date().toLocaleString('ru-RU')}`],
    [`Количество абитуриентов: ${selectedApplicants.length}`],
    [''],
    ...XLSX.utils.sheet_to_json(wsData, { header: 1 }),
  ];

  const ws = XLSX.utils.aoa_to_sheet(title);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
  ];

  if (!ws['!merges']) {
    ws['!merges'] = [];
  }

  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 7 } });

  XLSX.utils.book_append_sheet(wb, ws, 'Абитуриенты');

  const statsData = calculateResults(selectedApplicants, 0);

  const statsRows = [
    ['СТАТИСТИКА ВЫБОРКИ'],
    [''],
    ['Показатель', 'Значение'],
    ['Всего абитуриентов', statsData.selected_count],
    ['Абитуриентов с БВИ', `${statsData.bvi_count} (${statsData.bvi_percentage.toFixed(1)}%)`],
    ['С высшим приоритетом', statsData.high_priority_count],
    ['Средний балл выборки', statsData.calculated_avg_score.toFixed(2)],
    ['Средняя сумма баллов', statsData.avg_sum_score.toFixed(2)],
    ['Общая сумма баллов', statsData.total_sum_score],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
  wsStats['!cols'] = [{ wch: 30 }, { wch: 25 }];

  XLSX.utils.book_append_sheet(wb, wsStats, 'Статистика');

  const fileName = `расчет_${programCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportToCSV = (selectedApplicants, programCode) => {
  const headers = [
    'ФИО',
    'Сумма баллов',
    'Средний балл',
    'БВИ',
    'Высший приоритет',
    'Согласие',
    'ID',
  ];

  const data = selectedApplicants.map((applicant) => [
    `"${applicant.name}"`,
    applicant.sumScore || '',
    getApplicantAverageScore(applicant).toFixed(2),
    applicant.noExams ? 'Да' : 'Нет',
    applicant.topPriority ? 'Да' : 'Нет',
    applicant.approval ? 'Да' : 'Нет',
    applicant.id,
  ]);

  const csvContent = [
    headers.join(','),
    ...data.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `расчет_${programCode}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();

  window.URL.revokeObjectURL(url);
};

export const getScoreColor = (score) => {
  if (score >= 90) {
    return 'success.main';
  }

  if (score >= 75) {
    return 'primary.main';
  }

  return 'error.main';
};

export const getBorderColor = (applicant) => {
  const score = getApplicantAverageScore(applicant);

  if (score >= 90) {
    return 'success.main';
  }

  if (score >= 75) {
    return 'primary.main';
  }

  return 'warning.main';
};

const calculatorLogic = {
  filterApplicants,
  sortApplicants,
  calculateResults,
  validateSelection,
  getTopByScore,
  getOnlyBVI,
  getOnlyHighPriority,
  exportToExcel,
  exportToCSV,
  getApplicantAverageScore,
  getScoreColor,
  getBorderColor,
};

export default calculatorLogic;
