import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockIcon from '@mui/icons-material/Lock';
import { getRecommendations } from '../services/api';

const DEFAULT_CATEGORIES = [
  { id: '90_100', name: '90–100', median: 95, locked_count: 0 },
  { id: '80_89', name: '80–89', median: 85, locked_count: 0 },
  { id: '70_79', name: '70–79', median: 75, locked_count: 0 },
  { id: '60_69', name: '60–69', median: 65, locked_count: 0 },
  { id: '0_59', name: '0–59', median: 50, locked_count: 0 },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatSigned = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return `${number > 0 ? '+' : ''}${number}`;
};

const RecommendationsPage = ({ program, onError }) => {
  const navigate = useNavigate();
  const [admissionPlan, setAdmissionPlan] = useState(program?.admission_plan || 0);
  const [targetAvgScore, setTargetAvgScore] = useState(program?.target_avg_score || 0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [localError, setLocalError] = useState(null);

  const lockedCount = useMemo(() => {
    return categories.reduce((sum, category) => sum + toNumber(category.locked_count), 0);
  }, [categories]);

  const updateCategory = (categoryId, field, value) => {
    setCategories((prev) => prev.map((category) => (
      category.id === categoryId
        ? { ...category, [field]: value }
        : category
    )));
    setResult(null);
  };

  const validateForm = () => {
    const plan = toNumber(admissionPlan);
    const target = toNumber(targetAvgScore);

    if (!program?.id) {
      return 'Не выбрано направление подготовки';
    }
    if (!Number.isInteger(plan) || plan <= 0) {
      return 'План набора должен быть положительным целым числом';
    }
    if (target < 0 || target > 100) {
      return 'Целевой средний балл должен быть в диапазоне от 0 до 100';
    }
    if (lockedCount > plan) {
      return `Количество заблокированных мест (${lockedCount}) превышает план набора (${plan})`;
    }

    const invalidCategory = categories.find((category) => {
      const median = toNumber(category.median, -1);
      const locked = toNumber(category.locked_count, -1);
      return median < 0 || median > 100 || !Number.isInteger(locked) || locked < 0;
    });

    if (invalidCategory) {
      return 'Медианные планки должны быть от 0 до 100, а заблокированные места — целым числом от 0';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      if (onError) onError(validationError);
      return;
    }

    try {
      setLoading(true);
      setLocalError(null);
      setResult(null);

    const response = await getRecommendations(program.id, {
      direction_code: program.code,
      application_ids: [],
    });

    if (response.data?.enabled === false) {
      setLocalError(response.data.message || 'Режим рекомендаций временно отключён.');
      setResult(response.data);
      return;
    }

    setResult(response.data);
    } catch (err) {
      const message = err?.response?.data?.error || 'Не удалось получить рекомендации';
      setLocalError(message);
      if (onError) onError(message);
    } finally {
      setLoading(false);
    }
  };

  const resultCategories = result?.recommendations?.[0]?.categories || categories.map((category) => ({
    category_id: category.id,
    category_name: category.name,
    median: category.median,
  }));

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2, fontSize: { xs: '0.95rem', md: '1.05rem' } }}
      >
        Вернуться к выбору программы
      </Button>

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesomeIcon color="secondary" />
            <Typography variant="h5" fontWeight="bold">
              Система рекомендаций
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Подбор распределения абитуриентов по фиксированным категориям баллов. Для расчёта используется только медианная планка категории.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="h6" gutterBottom>
            {program?.name}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Chip label={`Код: ${program?.code || '-'}`} color="primary" variant="outlined" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Chip label={`План: ${program?.admission_plan || '-'} мест`} color="secondary" variant="outlined" />
            </Grid>
            <Grid item xs={12} md={4}>
              <Chip label={`Цель: ${program?.target_avg_score || '-'} баллов`} color="success" variant="outlined" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {localError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
          {localError}
        </Alert>
      )}

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Параметры расчёта
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="План набора"
                type="number"
                value={admissionPlan}
                onChange={(event) => setAdmissionPlan(event.target.value)}
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Целевой средний балл"
                type="number"
                value={targetAvgScore}
                onChange={(event) => setTargetAvgScore(event.target.value)}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Фиксированные категории баллов
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Категория</TableCell>
                  <TableCell align="right">Медианная планка</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Количество уже зафиксированных абитуриентов в этой категории. Их число сохраняется во всех вариантах распределения.">
                      <span>Заблокировано</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={category.median}
                        onChange={(event) => updateCategory(category.id, 'median', event.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={category.locked_count}
                        onChange={(event) => updateCategory(category.id, 'locked_count', event.target.value)}
                        inputProps={{ min: 0, step: 1 }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Заблокировано мест: {lockedCount}. Это фиксированное количество абитуриентов в категории, считаемое по её медианной планке.
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={loading ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
              onClick={handleSubmit}
              disabled={loading}
            >
              Получить рекомендации
            </Button>
          </Box>
        </CardContent>
      </Card>

      {result && (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Лучшие варианты распределения
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label="Расчёт: по медианной планке" />
              <Chip label={`Проверено комбинаций: ${result.checked_combinations}`} />
              <Chip label={`План набора: ${result.admission_plan}`} />
              <Chip label={`Цель: ${result.target_avg_score}`} />
            </Box>

            {result.recommendations?.length ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>№</TableCell>
                      <TableCell align="right">Итоговый средний</TableCell>
                      <TableCell align="right">Отклонение</TableCell>
                      {resultCategories.map((category) => (
                        <TableCell key={category.category_id} align="right">
                          {category.category_name}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            мед. {category.median ?? category.score}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.recommendations.map((recommendation) => (
                      <TableRow key={recommendation.rank} hover>
                        <TableCell>{recommendation.rank}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {recommendation.final_avg_score}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatSigned(recommendation.deviation_from_target)}
                        </TableCell>
                        {resultCategories.map((category) => {
                          const recommendationCategory = recommendation.categories.find(
                            (item) => item.category_id === category.category_id
                          );
                          return (
                            <TableCell key={category.category_id} align="right">
                              <Typography fontWeight={recommendationCategory?.is_locked ? 700 : 400}>
                                {recommendationCategory?.count ?? 0}
                              </Typography>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Подходящие варианты не найдены</Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RecommendationsPage;
