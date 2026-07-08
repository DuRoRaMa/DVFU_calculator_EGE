import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import { getPriorityDirectionStats } from '../../services/api';

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(2);
};

const numberOrDash = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return value;
};

const StatCard = ({
  icon,
  label,
  value,
  caption,
  tone = 'default',
}) => {
  const toneSx = {
    default: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderColor: '#e5e7eb',
      iconBg: '#eff6ff',
      iconColor: '#1d4ed8',
    },
    success: {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
      borderColor: '#bbf7d0',
      iconBg: '#dcfce7',
      iconColor: '#15803d',
    },
    warning: {
      background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
      borderColor: '#fde68a',
      iconBg: '#fef3c7',
      iconColor: '#b45309',
    },
    danger: {
      background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      borderColor: '#fecaca',
      iconBg: '#fee2e2',
      iconColor: '#b91c1c',
    },
  }[tone];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: toneSx.borderColor,
        background: toneSx.background,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            backgroundColor: toneSx.iconBg,
            color: toneSx.iconColor,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.35,
              fontWeight: 900,
              lineHeight: 1.15,
            }}
          >
            {value}
          </Typography>

          {caption && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.4 }}
            >
              {caption}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

const PriorityDirectionsStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setErrorText('');

    getPriorityDirectionStats()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setStats(response.data);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setIsForbidden(true);
          return;
        }

        setErrorText('Не удалось загрузить статистику по приоритетным направлениям.');
        console.error(error);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isForbidden) {
    return null;
  }

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid #e5e7eb',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Загружаем статистику по приоритетным направлениям...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (errorText) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {errorText}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const aggregate = stats.aggregate || {};
  const directions = Array.isArray(stats.directions) ? stats.directions : [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: '1px solid #bfdbfe',
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <StarIcon sx={{ color: '#1d4ed8' }} />

            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Приоритет 2030
            </Typography>

            <Chip
              size="small"
              label={`${numberOrDash(aggregate.directions_count)} направлений`}
              sx={{
                fontWeight: 700,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
              }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Отдельная статистика по направлениям с галочкой «Приоритет 2030».
          </Typography>
        </Box>
      </Stack>

      {directions.length === 0 ? (
        <Alert severity="info">
          Пока нет направлений с включённой галочкой «Приоритет 2030».
          Включи её у нужных направлений в Django admin.
        </Alert>
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUpIcon />}
                label="Средний по плану"
                value={formatScore(aggregate.average_score_by_plan)}
                caption="Сумма ВПП / общий план"
                tone="warning"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<FactCheckIcon />}
                label="Средний по ВПП"
                value={formatScore(aggregate.average_score_by_vpp_count)}
                caption="Качество найденных ВПП"
                tone="success"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<GroupsIcon />}
                label="ВПП в плане"
                value={`${numberOrDash(aggregate.plan_applications_count)}/${numberOrDash(aggregate.total_admission_plan)}`}
                caption={`Заполнено ${formatScore(aggregate.plan_fill_percent)}%`}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<WarningAmberIcon />}
                label="Не хватает ВПП"
                value={numberOrDash(aggregate.plan_missing_count)}
                caption={`Всего заявлений: ${numberOrDash(aggregate.total_applications)}`}
                tone={aggregate.plan_missing_count > 0 ? 'warning' : 'success'}
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              overflowX: 'auto',
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Код</TableCell>
                  <TableCell>Направление</TableCell>
                  <TableCell align="right">План</TableCell>
                  <TableCell align="right">ВПП в плане</TableCell>
                  <TableCell align="right">Не хватает</TableCell>
                  <TableCell align="right">Средний по плану</TableCell>
                  <TableCell align="right">Средний по ВПП</TableCell>
                  <TableCell align="right">Заявлений</TableCell>
                  <TableCell align="right">Согласий</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {directions.map((row) => (
                  <TableRow key={row.direction_code}>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {row.direction_code}
                    </TableCell>

                    <TableCell sx={{ minWidth: 260 }}>
                      {row.direction_name}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.admission_plan)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.plan_applications_count)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.plan_missing_count)}
                    </TableCell>

                    <TableCell align="right">
                      {formatScore(row.average_score_by_plan)}
                    </TableCell>

                    <TableCell align="right">
                      {formatScore(row.average_score_by_vpp_count)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.total_applications)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.approvals_count)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default PriorityDirectionsStats;
