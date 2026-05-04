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
    onFilterChange({
      ...filters,
      [filterName]: !filters[filterName],
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

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 3,
        borderRadius: 3,
      }}
    >
      <Stack spacing={2}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListIcon color="primary" />

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ fontSize: { xs: '1.2rem', md: '1.45rem' } }}
            >
              Фильтры
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}
          >
            Показано: {filteredCount} из {totalApplicants}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
          В фильтре используется средний балл абитуриента. Значения должны быть в диапазоне от 0 до 100.
        </Alert>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(filters.bvi)}
                    onChange={() => handleFilterToggle('bvi')}
                    size="medium"
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                    Только БВИ
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(filters.highPriority)}
                    onChange={() => handleFilterToggle('highPriority')}
                    size="medium"
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                    Высший приоритет
                  </Typography>
                }
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems="flex-start"
            >
              <TextField
                label="Средний балл от"
                type="number"
                value={minScoreInput}
                onChange={handleMinScoreChange}
                onBlur={handleScoreBlur}
                error={isMinInvalid || isRangeInvalid}
                helperText={
                  isMinInvalid
                    ? 'Введите число от 0 до 100'
                    : isRangeInvalid
                      ? 'Минимальный балл не должен быть больше максимального'
                      : 'От 0 до 100'
                }
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 0.01,
                }}
                fullWidth
              />

              <TextField
                label="Средний балл до"
                type="number"
                value={maxScoreInput}
                onChange={handleMaxScoreChange}
                onBlur={handleScoreBlur}
                error={isMaxInvalid || isRangeInvalid}
                helperText={
                  isMaxInvalid
                    ? 'Введите число от 0 до 100'
                    : isRangeInvalid
                      ? 'Максимальный балл не должен быть меньше минимального'
                      : 'От 0 до 100'
                }
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 0.01,
                }}
                fullWidth
              />
            </Stack>
          </Grid>
        </Grid>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Button
            startIcon={<SortIcon />}
            variant={sortField === 'avg_score' ? 'contained' : 'outlined'}
            onClick={() => onSortChange('avg_score')}
            size="large"
          >
            По среднему баллу{' '}
            {sortField === 'avg_score' && (sortDirection === 'desc' ? '↓' : '↑')}
          </Button>

          <Button
            variant={sortField === 'sumScore' ? 'contained' : 'outlined'}
            onClick={() => onSortChange('sumScore')}
            size="large"
          >
            По сумме баллов{' '}
            {sortField === 'sumScore' && (sortDirection === 'desc' ? '↓' : '↑')}
          </Button>

          <Button
            variant={sortField === 'name' ? 'contained' : 'outlined'}
            onClick={() => onSortChange('name')}
            size="large"
          >
            По имени {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default FiltersPanel;
