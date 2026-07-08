import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import ProgramHeader from '../components/calculator/ProgramHeader';
import FiltersPanel from '../components/calculator/FiltersPanel';
import ApplicantsTable from '../components/calculator/ApplicantsTable';
import SelectedTable from '../components/calculator/SelectedTable';
import ResultsPanel from '../components/calculator/ResultsPanel';
import QuickSelectionPanel from '../components/calculator/QuickSelectionPanel';

import {
  filterApplicants,
  sortApplicants,
  calculateResults,
  exportToExcel,
  exportToCSV,
} from '../components/calculator/utils/calculatorLogic';

import { getDirectionApplicants } from '../services/api';

const mapApplicantFromApi = (applicant) => {
  return {
    id: applicant.student_id,
    studentId: applicant.student_id,
    name: applicant.student_name,
    avg_score: Number(applicant.avg_score || 0),
    sumScore: Number(applicant.sum_score || 0),
    noExams: Boolean(applicant.no_exams),

    approval: Boolean(applicant.approval),
    topPriority: Boolean(applicant.top_priority),
    hightPriorityNoOriginal: Boolean(applicant.high_priority_no_original),

    statusVuz: applicant.status_vuz || '',
  };
};

const CalculatorPage = ({ program, onError }) => {
  const navigate = useNavigate();

  const [allApplicants, setAllApplicants] = useState([]);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(false);
  const [applicantsLoading, setApplicantsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [sortField, setSortField] = useState('avg_score');
  const [sortDirection, setSortDirection] = useState('desc');

  const [filters, setFilters] = useState({
    bvi: false,
    highPriority: false,
    noOriginals: false,
    withApproval: false,
    withoutApproval: false,
    minScore: 0,
    maxScore: 100,
  });

  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  useEffect(() => {
    const loadApplicants = async () => {
      if (!program?.code) {
        setAllApplicants([]);
        setApplicantsLoading(false);
        return;
      }

      try {
        setApplicantsLoading(true);
        setLoadError(null);

        const response = await getDirectionApplicants(program.code);
        const mappedApplicants = response.data.map(mapApplicantFromApi);

        setAllApplicants(mappedApplicants);
        setSelectedApplicants([]);
        setResults(null);
      } catch (err) {
        console.error(err);
        setLoadError('Не удалось загрузить абитуриентов по направлению');
        setAllApplicants([]);
      } finally {
        setApplicantsLoading(false);
      }
    };

    loadApplicants();
  }, [program]);

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

  const filteredApplicants = filterApplicants(allApplicants, filters);

  const sortedApplicants = sortApplicants(
    filteredApplicants,
    sortField,
    sortDirection
  );

  const calculateAverage = () => {
    if (selectedApplicants.length === 0) {
      onError('Выберите хотя бы одного абитуриента');
      return;
    }

    if (selectedApplicants.length > program.admission_plan) {
      onError(
        `Превышен план приёма. Выбрано: ${selectedApplicants.length}, доступно: ${program.admission_plan}`
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const calculatedResults = calculateResults(
        selectedApplicants,
        program.target_avg_score
      );

      setResults(calculatedResults);
      setLoading(false);
    }, 300);
  };

  const addToSelection = (applicant) => {
    if (selectedApplicants.length >= program.admission_plan) {
      onError(`Достигнут лимит плана приёма: ${program.admission_plan} мест`);
      return;
    }

    if (selectedApplicants.some((app) => app.id === applicant.id)) {
      onError('Этот абитуриент уже добавлен в выборку');
      return;
    }

    setSelectedApplicants((prev) => [...prev, applicant]);
    setResults(null);
  };

  const removeFromSelection = (applicantId) => {
    setSelectedApplicants((prev) =>
      prev.filter((applicant) => applicant.id !== applicantId)
    );
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
        selected = sortedApplicants
          .filter((applicant) => applicant.noExams)
          .slice(0, program.admission_plan);
        break;

      case 'highPriority':
        selected = sortedApplicants
          .filter((applicant) => applicant.topPriority)
          .slice(0, program.admission_plan);
        break;

      default:
        selected = [];
        break;
    }

    if (selected.length === 0) {
      onError('По выбранному быстрому фильтру нет подходящих абитуриентов');
      return;
    }

    setSelectedApplicants(selected);
    setResults(null);
  };

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
      }

      if (format === 'csv') {
        exportToCSV(selectedApplicants, program.code);
      }
    } catch (error) {
      onError(error.message || 'Ошибка при экспорте данных');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{
          mb: 2,
          fontSize: { xs: '0.95rem', md: '1.05rem' },
        }}
      >
        Вернуться к выбору программы
      </Button>

      <ProgramHeader
        program={program}
        selectedCount={selectedApplicants.length}
        onBack={() => navigate('/')}
      />

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
          {loadError}
        </Alert>
      )}

      {applicantsLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <QuickSelectionPanel
            onSelect={handleQuickSelection}
            selectedCount={selectedApplicants.length}
            admissionPlan={program.admission_plan}
          />

          <FiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            totalApplicants={allApplicants.length}
            filteredCount={sortedApplicants.length}
          />

          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                lg: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 3,
              alignItems: 'stretch',
            }}
          >
            <Box sx={{ minWidth: 0, width: '100%', display: 'flex' }}>
              <ApplicantsTable
                applicants={sortedApplicants}
                selectedIds={selectedApplicants.map((applicant) => applicant.id)}
                onAdd={addToSelection}
                admissionPlan={program.admission_plan}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </Box>

            <Box sx={{ minWidth: 0, width: '100%', display: 'flex' }}>
              <SelectedTable
                selectedApplicants={selectedApplicants}
                onRemove={removeFromSelection}
                onClear={clearSelection}
                onCalculate={calculateAverage}
                loading={loading}
                admissionPlan={program.admission_plan}
              />
            </Box>
          </Box>

          {results && (
            <ResultsPanel
              results={results}
              program={program}
              selectedApplicants={selectedApplicants}
            />
          )}

          {selectedApplicants.length > 0 && (
            <Box
              sx={{
                position: 'fixed',
                right: 24,
                bottom: 24,
                zIndex: 1000,
              }}
            >
              <Button
                variant="contained"
                startIcon={<SaveAltIcon />}
                endIcon={<ExpandMoreIcon />}
                onClick={handleExportClick}
                color="secondary"
                size="large"
                sx={{
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
              >
                Экспорт ({selectedApplicants.length})
              </Button>
            </Box>
          )}

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
        </>
      )}
    </Box>
  );
};

export default CalculatorPage;
