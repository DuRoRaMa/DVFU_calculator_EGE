import React from 'react';
import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const ProgramHeader = ({ program, selectedCount }) => {
  const availablePlaces = program.admission_plan - selectedCount;
  const monitoring = program.monitoring;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ fontSize: { xs: '1.65rem', md: '2.25rem' } }}
        >
          Расчет среднего балла ЕГЭ
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontSize: { xs: '1.1rem', md: '1.35rem' } }}
        >
          {program.name}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }} color="text.secondary">
            План приёма
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {program.admission_plan} мест
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }} color="text.secondary">
            Целевой балл
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {program.target_avg_score}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }} color="text.secondary">
            Выбрано
          </Typography>
          <Chip
            label={`${selectedCount}/${program.admission_plan}`}
            color={selectedCount > program.admission_plan ? 'error' : 'primary'}
            sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }} color="text.secondary">
            Доступно мест
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {availablePlaces > 0 ? availablePlaces : 0}
          </Typography>
        </Grid>
      </Grid>

      {monitoring && (
        <>
          <Divider sx={{ my: 2 }} />

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              mb: 1,
              fontSize: { xs: '1.15rem', md: '1.35rem' },
            }}
          >
            Данные мониторинга по направлению
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              color="primary"
              label={`Средний балл по плану приема: ${monitoring.avg_score}`}
              sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
            />

            <Chip
              label={`Абитуриентов: ${monitoring.applicants_count}`}
              sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
            />

            <Chip
              color="success"
              label={`Согласий: ${monitoring.approval_count}`}
              sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
            />

            <Chip
              color="secondary"
              label={`Высший приоритет: ${monitoring.top_priority_count}`}
              sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
            />

            <Chip
              color="warning"
              label={`План приема: ${monitoring.admission_plan || program.admission_plan}`}
              sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
            />
          </Stack>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
            }}
          >
            Средний балл по плану приема считается как сумма средних баллов
            абитуриентов с высшим приоритетом, деленная на план приема.
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default ProgramHeader;
