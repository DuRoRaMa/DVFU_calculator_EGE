import React from 'react';
import {
  Alert,
  Box,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ResultsPanel = ({ results, program }) => {
  if (!results) {
    return null;
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3, borderRadius: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        gutterBottom
        sx={{ fontSize: { xs: '1.35rem', md: '1.65rem' } }}
      >
        Результаты расчета
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={3}>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            Средний балл выборки
          </Typography>

          <Typography variant="caption" color="text.secondary">
            План приема не учитывается
          </Typography>

          <Typography variant="h4" fontWeight={700}>
            {results.calculated_avg_score.toFixed(2)}
          </Typography>
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            Целевой балл
          </Typography>

          <Typography variant="h4" fontWeight={700}>
            {program.target_avg_score}
          </Typography>
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            Отклонение
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            color={results.deviation_from_target >= 0 ? 'success.main' : 'error.main'}
          >
            {results.deviation_from_target >= 0 ? '+' : ''}
            {results.deviation_from_target.toFixed(2)}
          </Typography>
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            Статус
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={1}>
            {results.is_above_target ? (
              <>
                <CheckCircleIcon color="success" />
                <Typography fontWeight={700} color="success.main">
                  Выше цели
                </Typography>
              </>
            ) : (
              <>
                <CancelIcon color="error" />
                <Typography fontWeight={700} color="error.main">
                  Ниже цели
                </Typography>
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{ fontSize: { xs: '1.15rem', md: '1.35rem' } }}
      >
        Статистика выборки
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography color="text.secondary">Всего выбрано</Typography>
          <Typography variant="h6" fontWeight={700}>
            {results.selected_count} чел.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="text.secondary">БВИ</Typography>
          <Typography variant="h6" fontWeight={700}>
            {results.bvi_count} чел. ({results.bvi_percentage.toFixed(1)}%)
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="text.secondary">Высший приоритет</Typography>
          <Typography variant="h6" fontWeight={700}>
            {results.high_priority_count} чел.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="text.secondary">Средняя сумма баллов</Typography>
          <Typography variant="h6" fontWeight={700}>
            {results.avg_sum_score.toFixed(2)}
          </Typography>
        </Grid>
      </Grid>

      {results.has_bvi && (
        <Alert severity="info" sx={{ mt: 3, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
          В расчете учтены абитуриенты с БВИ. Для них средний балл считается как 100.
          {results.bvi_count < results.selected_count && (
            <> Средний без учета БВИ: {results.avg_without_bvi.toFixed(2)}.</>
          )}
        </Alert>
      )}

      <Alert
        severity={results.is_above_target ? 'success' : 'warning'}
        sx={{ mt: 3, fontSize: { xs: '0.95rem', md: '1.05rem' } }}
      >
        Средний балл выборки по выбранным {results.selected_count} абитуриентам составляет{' '}
        {results.calculated_avg_score.toFixed(2)} баллов. Этот показатель не учитывает
        план приема и считается только по выбранной вручную выборке.
      </Alert>
    </Paper>
  );
};

export default ResultsPanel;
