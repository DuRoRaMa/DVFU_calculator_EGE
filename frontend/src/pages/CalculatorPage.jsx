// src/pages/CalculatorPage.jsx
import React, { useState, useEffect } from 'react';
import { 
 Box, 
  Button, 
  Grid,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Компоненты
import ProgramHeader from '../components/calculator/ProgramHeader';
import FiltersPanel from '../components/calculator/FiltersPanel';
import ApplicantsTable from '../components/calculator/ApplicantsTable';
import SelectedTable from '../components/calculator/SelectedTable';
import ResultsPanel from '../components/calculator/ResultsPanel';
import QuickSelectionPanel from '../components/calculator/QuickSelectionPanel';

// Логика
import { 
  filterApplicants, 
  sortApplicants, 
  calculateResults, 
  validateSelection,
  exportToExcel,
  exportToCSV 
} from '../components/calculator/utils/calculatorLogic';
import { mockApplicants } from '../utils/mockApplicants';

const CalculatorPage = ({ program, onError }) => {
  const navigate = useNavigate();
  
  // Основные состояния
  const [allApplicants, setAllApplicants] = useState(mockApplicants);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Состояния для фильтрации и сортировки
  const [sortField, setSortField] = useState('avg_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    bvi: false,
    highPriority: false,
    noOriginals: false,
    minScore: 0,
    maxScore: 100
  });

  // Состояние для меню экспорта
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // Загрузка данных
  useEffect(() => {
    setAllApplicants(mockApplicants);
  }, []);

  // Обработчики фильтрации и сортировки
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Расчет отфильтрованных и отсортированных данных
  const filteredApplicants = filterApplicants(allApplicants, filters);
  const sortedApplicants = sortApplicants(filteredApplicants, sortField, sortDirection);

  // Основные функции
  const calculateAverage = () => {
    if (selectedApplicants.length === 0) {
      onError('Выберите хотя бы одного абитуриента');
      return;
    }

    if (selectedApplicants.length > program.admission_plan) {
      onError(`Превышен план приёма. Выбрано: ${selectedApplicants.length}, доступно: ${program.admission_plan}`);
      return;
    }

    setLoading(true);
    
    // Имитация запроса к API
    setTimeout(() => {
      const calculatedResults = calculateResults(selectedApplicants, program.target_avg_score);
      setResults(calculatedResults);
      setLoading(false);
    }, 500);
  };

  const addToSelection = (applicant) => {
    if (selectedApplicants.length >= program.admission_plan) {
      onError(`Достигнут лимит плана приёма: ${program.admission_plan} мест`);
      return;
    }
    
    if (!selectedApplicants.some(app => app.id === applicant.id)) {
      setSelectedApplicants(prev => [...prev, applicant]);
      // Сбросить результаты при изменении состава
      setResults(null);
    }
  };

  const removeFromSelection = (applicantId) => {
    setSelectedApplicants(prev => prev.filter(app => app.id !== applicantId));
    setResults(null);
  };

  const clearSelection = () => {
    setSelectedApplicants([]);
    setResults(null);
  };

  const handleQuickSelection = (selectionType) => {
    let selected = [];
    
    switch (selectionType) {
      case 'top':
        selected = sortedApplicants.slice(0, program.admission_plan);
        break;
      case 'bvi':
        selected = sortedApplicants.filter(app => app.noExams).slice(0, program.admission_plan);
        break;
      case 'highPriority':
        selected = sortedApplicants.filter(app => app.topPriority).slice(0, program.admission_plan);
        break;
      default:
        break;
    }
    
    if (selected.length > 0) {
      setSelectedApplicants(selected);
      setResults(null);
    }
  };

  // Функции для экспорта
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportFormat = (format) => {
    handleExportClose();
    
    if (selectedApplicants.length === 0) {
      onError('Нет выбранных абитуриентов для экспорта');
      return;
    }
    
    try {
      if (format === 'excel') {
        exportToExcel(selectedApplicants, program.code, program.name);
      } else if (format === 'csv') {
        exportToCSV(selectedApplicants, program.code);
      }
    } catch (error) {
      onError(error.message || 'Ошибка при экспорте данных');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Шапка с кнопкой назад */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Вернуться к выбору программы
        </Button>
        
        <ProgramHeader 
          program={program}
          selectedCount={selectedApplicants.length}
        />
        
        {/* Панель быстрого выбора */}
        <QuickSelectionPanel
          onSelect={handleQuickSelection}
          selectedCount={selectedApplicants.length}
          admissionPlan={program.admission_plan}
        />
        
        {/* Панель фильтров */}
        <FiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          totalApplicants={allApplicants.length}
          filteredCount={filteredApplicants.length}
        />
      </Box>

      {/* Две таблицы бок о бок */}
      <Grid container spacing={3} justifyContent="center">
        {/* Левая таблица: Все абитуриенты */}
        <Grid item xs={12} md={6} sx={{ width: '48%' }}>
          <ApplicantsTable
            applicants={sortedApplicants}
            selectedIds={selectedApplicants.map(app => app.id)}
            onAdd={addToSelection}
            admissionPlan={program.admission_plan}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </Grid>

        {/* Правая таблица: Выбранные абитуриенты */}
        <Grid item xs={12} md={6} sx={{ width: '48%' }}>
          <SelectedTable
            selectedApplicants={selectedApplicants}
            onRemove={removeFromSelection}
            onClear={clearSelection}
            onCalculate={calculateAverage}
            loading={loading}
            admissionPlan={program.admission_plan}
          />
        </Grid>
      </Grid>

      {/* Блок с результатами расчета */}
      {results && (
        <ResultsPanel
          results={results}
          program={program}
          selectedApplicants={selectedApplicants}
        />
      )}

      {/* Кнопка экспорта в правом нижнем углу */}
      {selectedApplicants.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          <Button
            variant="contained"
            startIcon={<SaveAltIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleExportClick}
            color="secondary"
            sx={{
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            Экспорт ({selectedApplicants.length})
          </Button>
        </Box>
      )}

      {/* Меню выбора формата экспорта */}
      {exportAnchorEl && (
        <Box>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
            >
            <MenuItem onClick={() => handleExportFormat('excel')}>
                <ListItemIcon>
                <TableChartIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Excel (XLSX)</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportFormat('csv')}>
                <ListItemIcon>
                <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>CSV</ListItemText>
            </MenuItem>
            </Menu>
        </Box>
      )}
    </Box>
  );
};

export default CalculatorPage;