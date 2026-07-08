import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';

const normalizeScoreInput = (value) => {
  return value.replace(',', '.');
};

const isScoreInRange = (value) => {
  if (value === '') {
    return false;
  }

  const numberValue = Number(value);

  return !Number.isNaN(numberValue) && numberValue >= 0 && numberValue <= 100;
};

const clampScore = (value, fallback) => {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, numberValue));
};

const FiltersPanel = ({
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  totalApplicants,
  filteredCount,
}) => {
  const [minScoreInput, setMinScoreInput] = useState(String(filters.minScore ?? 0));
  const [maxScoreInput, setMaxScoreInput] = useState(String(filters.maxScore ?? 100));

  useEffect(() => {
    setMinScoreInput(String(filters.minScore ?? 0));
    setMaxScoreInput(String(filters.maxScore ?? 100));
  }, [filters.minScore, filters.maxScore]);

  const minNumber = Number(minScoreInput);
  const maxNumber = Number(maxScoreInput);

  const isMinInvalid = !isScoreInRange(minScoreInput);
  const isMaxInvalid = !isScoreInRange(maxScoreInput);
  const isRangeInvalid = !isMinInvalid && !isMaxInvalid && minNumber > maxNumber;

  const handleFilterToggle = (filterName) => {
    const nextFilters = {
      ...filters,
      [filterName]: !filters[filterName],
    };

    // Эти два фильтра взаимоисключающие.
    if (filterName === 'withApproval' && !filters.withApproval) {
      nextFilters.withoutApproval = false;
    }

    if (filterName === 'withoutApproval' && !filters.withoutApproval) {
      nextFilters.withApproval = false;
    }

    onFilterChange(nextFilters);
  };

  const resetFilters = () => {
    onFilterChange({
      bvi: false,
      highPriority: false,
      noOriginals: false,
      withApproval: false,
      withoutApproval: false,
      minScore: 0,
      maxScore: 100,
    });
  };

  const commitValidRange = (nextMinInput, nextMaxInput) => {
    if (!isScoreInRange(nextMinInput) || !isScoreInRange(nextMaxInput)) {
      return;
    }

    const nextMin = Number(nextMinInput);
    const nextMax = Number(nextMaxInput);

    if (nextMin > nextMax) {
      return;
    }

    onFilterChange({
      ...filters,
      minScore: nextMin,
      maxScore: nextMax,
    });
  };

  const handleMinScoreChange = (event) => {
    const value = normalizeScoreInput(event.target.value);

    setMinScoreInput(value);
    commitValidRange(value, maxScoreInput);
  };

  const handleMaxScoreChange = (event) => {
    const value = normalizeScoreInput(event.target.value);

    setMaxScoreInput(value);
    commitValidRange(minScoreInput, value);
  };

  const handleScoreBlur = () => {
    let nextMin = clampScore(minScoreInput, 0);
    let nextMax = clampScore(maxScoreInput, 100);

    if (nextMin > nextMax) {
      nextMax = nextMin;
    }

    setMinScoreInput(String(nextMin));
    setMaxScoreInput(String(nextMax));

    onFilterChange({
      ...filters,
      minScore: nextMin,
      maxScore: nextMax,
    });
  };

  const sortButtonLabel = (field, label) => {
    if (sortField !== field) {
      return label;
    }

    return `${label} ${sortDirection === 'desc' ? '↓' : '↑'}`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        mb: 2,
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterListIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Фильтры
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Показано: {filteredCount} из {totalApplicants}
          </Typography>
        </Box>

        <Button
          variant="text"
          onClick={resetFilters}
          size="small"
          sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
        >
          Сбросить фильтры
        </Button>
      </Stack>

      {(isMinInvalid || isMaxInvalid || isRangeInvalid) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          В фильтре используется средний балл абитуриента. Значения должны быть в диапазоне от 0 до 100.
        </Alert>
      )}

      <Grid container spacing={1.5} alignItems="stretch">
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
              gap: 1,
            }}
          >
            <TextField
              label="Мин. средний балл"
              value={minScoreInput}
              onChange={handleMinScoreChange}
              onBlur={handleScoreBlur}
              error={isMinInvalid || isRangeInvalid}
              fullWidth
              size="small"
            />

            <TextField
              label="Макс. средний балл"
              value={maxScoreInput}
              onChange={handleMaxScoreChange}
              onBlur={handleScoreBlur}
              error={isMaxInvalid || isRangeInvalid}
              fullWidth
              size="small"
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                lg: 'repeat(5, minmax(0, 1fr))',
              },
              gap: 0.5,
              '& .MuiFormControlLabel-root': {
                m: 0,
                px: 1,
                py: 0.6,
                borderRadius: 2,
                border: '1px solid #eef2f7',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filters.bvi)}
                  onChange={() => handleFilterToggle('bvi')}
                  size="small"
                />
              }
              label={<Typography variant="body2">БВИ</Typography>}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filters.highPriority)}
                  onChange={() => handleFilterToggle('highPriority')}
                  size="small"
                />
              }
              label={<Typography variant="body2">Высший приоритет</Typography>}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filters.withApproval)}
                  onChange={() => handleFilterToggle('withApproval')}
                  size="small"
                />
              }
              label={<Typography variant="body2">С согласием</Typography>}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filters.withoutApproval)}
                  onChange={() => handleFilterToggle('withoutApproval')}
                  size="small"
                />
              }
              label={<Typography variant="body2">Без согласия</Typography>}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filters.noOriginals)}
                  onChange={() => handleFilterToggle('noOriginals')}
                  size="small"
                />
              }
              label={<Typography variant="body2">ВПР без оригинала</Typography>}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <SortIcon color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Сортировка
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Button
            variant={sortField === 'avg_score' ? 'contained' : 'outlined'}
            onClick={() => onSortChange('avg_score')}
            size="small"
          >
            {sortButtonLabel('avg_score', 'По среднему')}
          </Button>

          <Button
            variant={sortField === 'sumScore' ? 'contained' : 'outlined'}
            onClick={() => onSortChange('sumScore')}
            size="small"
          >
            {sortButtonLabel('sumScore', 'По сумме')}
          </Button>

          <Button
            variant={sortField === 'name' ? 'contained' : 'outlined'}
            onClick={() => onSortChange('name')}
            size="small"
          >
            {sortButtonLabel('name', 'По имени')}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default FiltersPanel;