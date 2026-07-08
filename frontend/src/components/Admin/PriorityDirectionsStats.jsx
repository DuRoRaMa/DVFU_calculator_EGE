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
import FlagIcon from '@mui/icons-material/Flag';
import DifferenceIcon from '@mui/icons-material/Difference';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';

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

const getStatusLabel = (status) => {
  if (status === 'success') {
    return 'Цель достигнута';
  }

  if (status === 'warning') {
    return 'Близко к цели';
  }

  if (status === 'danger') {
    return 'Ниже цели';
  }

  return 'Цель не задана';
};

const getStatusChipColor = (status) => {
  if (status === 'success') {
    return 'success';
  }

  if (status === 'warning') {
    return 'warning';
  }

  if (status === 'danger') {
    return 'error';
  }

  return 'default';
};

const getDeltaText = (delta) => {
  if (delta === null || delta === undefined || Number.isNaN(Number(delta))) {
    return '—';
  }

  const numberValue = Number(delta);

  if (numberValue > 0) {
    return `+${numberValue.toFixed(2)}`;
  }

  return numberValue.toFixed(2);
};

const getDeltaColor = (delta) => {
  if (delta === null || delta === undefined || Number.isNaN(Number(delta))) {
    return 'text.secondary';
  }

  const numberValue = Number(delta);

  if (numberValue >= 0) {
    return 'success.main';
  }

  if (numberValue >= -1) {
    return 'warning.main';
  }

  return 'error.main';
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
              wordBreak: 'break-word',
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

        setErrorText('Не удалось загрузить статистику по Приоритету 2030.');
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
            Загружаем статистику по Приоритету 2030...
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
  const ugsnGroups = Array.isArray(stats.ugsn_groups) ? stats.ugsn_groups : [];
  const directions = Array.isArray(stats.directions) ? stats.directions : [];

  const hasPriorityDirections = directions.length > 0;

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
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <StarIcon sx={{ color: '#1d4ed8' }} />

            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Приоритет 2030
            </Typography>

            <Chip
              size="small"
              label={getStatusLabel(aggregate.status)}
              color={getStatusChipColor(aggregate.status)}
              sx={{ fontWeight: 700 }}
            />

            <Chip
              size="small"
              label={`${numberOrDash(aggregate.directions_count)} НПС`}
              sx={{
                fontWeight: 700,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
              }}
            />

            <Chip
              size="small"
              label={`${numberOrDash(aggregate.ugsn_count)} УГСН`}
              sx={{
                fontWeight: 700,
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
              }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Статистика по направлениям с галочкой «Приоритет 2030»: факт среднего балла, целевые показатели и отклонение.
          </Typography>
        </Box>
      </Stack>

      {!hasPriorityDirections ? (
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
                label="Факт среднего балла"
                value={formatScore(aggregate.actual_avg_score)}
                caption="Средний по ВПП по всем приоритетным НПС"
                tone="success"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<FlagIcon />}
                label="Целевой показатель"
                value={formatScore(aggregate.target_avg_score)}
                caption="Настраивается в целевых показателях"
                tone="warning"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<DifferenceIcon />}
                label="Отклонение"
                value={getDeltaText(aggregate.delta)}
                caption="Факт минус цель"
                tone={
                  aggregate.status === 'success'
                    ? 'success'
                    : aggregate.status === 'warning'
                      ? 'warning'
                      : aggregate.status === 'danger'
                        ? 'danger'
                        : 'default'
                }
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<GroupsIcon />}
                label="ВПП"
                value={numberOrDash(aggregate.vpp_count)}
                caption="Количество ВПП в расчёте"
              />
            </Grid>
          </Grid>

          <Typography
            variant="subtitle1"
            sx={{
              mt: 2,
              mb: 1,
              fontWeight: 900,
            }}
          >
            Группировка по УГСН
          </Typography>

          <Box
            sx={{
              overflowX: 'auto',
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              mb: 3,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>УГСН</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell align="right">Факт</TableCell>
                  <TableCell align="right">Цель</TableCell>
                  <TableCell align="right">Отклонение</TableCell>
                  <TableCell align="right">НПС</TableCell>
                  <TableCell align="right">ВПП</TableCell>
                  <TableCell align="right">Статус</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {ugsnGroups.map((row) => (
                  <TableRow key={row.ugsn_code}>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 800 }}>
                      {row.ugsn_code}
                    </TableCell>

                    <TableCell sx={{ minWidth: 260 }}>
                      {row.ugsn_name}
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      {formatScore(row.actual_avg_score)}
                    </TableCell>

                    <TableCell align="right">
                      {formatScore(row.target_avg_score)}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: getDeltaColor(row.delta),
                      }}
                    >
                      {getDeltaText(row.delta)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.directions_count)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.vpp_count)}
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={getStatusLabel(row.status)}
                        color={getStatusChipColor(row.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              mt: 2,
              mb: 1,
              fontWeight: 900,
            }}
          >
            Детализация по НПС
          </Typography>

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
                  <TableCell>Код НПС</TableCell>
                  <TableCell>Направление</TableCell>
                  <TableCell>УГСН</TableCell>
                  <TableCell align="right">Факт</TableCell>
                  <TableCell align="right">Цель НПС</TableCell>
                  <TableCell align="right">Отклонение</TableCell>
                  <TableCell align="right">ВПП</TableCell>
                  <TableCell align="right">Статус</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {directions.map((row) => (
                  <TableRow key={`${row.direction_code}-${row.direction_name}`}>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 800 }}>
                      {row.direction_code}
                    </TableCell>

                    <TableCell sx={{ minWidth: 280 }}>
                      {row.direction_name}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.ugsn_code}
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      {formatScore(row.actual_avg_score)}
                    </TableCell>

                    <TableCell align="right">
                      {formatScore(row.target_avg_score)}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: getDeltaColor(row.delta),
                      }}
                    >
                      {getDeltaText(row.delta)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.vpp_count)}
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={getStatusLabel(row.status)}
                        color={getStatusChipColor(row.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Цель по НПС берётся из поля «Целевой средний балл» у направления.
            Цель по УГСН и общая цель Приоритета 2030 настраиваются отдельно в Django admin.
          </Alert>
        </>
      )}
    </Paper>
  );
};

export default PriorityDirectionsStats;
