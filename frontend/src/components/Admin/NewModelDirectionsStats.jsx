import React, { useEffect, useState } from 'react';

import {
  Alert,
  Box,
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

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { getNewModelDirectionStats } from '../../services/api';

const formatScore = (value) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  return Number(value).toFixed(2);
};

const numberOrDash = (value) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  return value;
};

const StatCard = ({
  icon,
  label,
  value,
  caption,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      height: '100%',
      borderRadius: 3,
      border: '1px solid #dbeafe',
      background:
        'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
    }}
  >
    <Stack direction="row" spacing={1.5}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2.5,
          display: 'grid',
          placeItems: 'center',
          color: '#1d4ed8',
          backgroundColor: '#dbeafe',
          flex: '0 0 auto',
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography
          variant="h5"
          sx={{
            mt: 0.35,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>

        {caption && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {caption}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

const NewModelDirectionsStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isMounted = true;

    getNewModelDirectionStats()
      .then((response) => {
        if (isMounted) {
          setStats(response.data);
        }
      })
      .catch((error) => {
        console.error(error);

        if (isMounted) {
          setErrorText(
            'Не удалось загрузить статистику по новой модели.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

          <Typography variant="body2">
            Загружаем статистику по новой модели...
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

  const aggregate = stats?.aggregate || {};
  const directions = Array.isArray(stats?.directions)
    ? stats.directions
    : [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: '1px solid #bbf7d0',
        background:
          'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 0.5 }}
      >
        <AutoAwesomeIcon sx={{ color: '#15803d' }} />

        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Новая модель
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Сводная статистика по направлениям с отметкой
        «Новая модель».
      </Typography>

      {directions.length === 0 ? (
        <Alert severity="info">
          Нет направлений с включённой отметкой
          «Новая модель».
        </Alert>
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUpIcon />}
                label="Средний балл по ВПП"
                value={formatScore(
                  aggregate.average_score_by_vpp_count
                )}
                caption="Фактический средний ВПП"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<SchoolIcon />}
                label="Количество мест"
                value={numberOrDash(
                  aggregate.admission_plan
                )}
                caption="Общий план набора"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<GroupsIcon />}
                label="Количество ВПП"
                value={numberOrDash(
                  aggregate.plan_applications_count
                )}
                caption={`Не хватает: ${numberOrDash(
                  aggregate.plan_missing_count
                )}`}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<AutoAwesomeIcon />}
                label="Количество БВИ"
                value={numberOrDash(
                  aggregate.no_exams_count
                )}
                caption="Заявления без вступительных испытаний"
              />
            </Grid>
          </Grid>

          <Typography
            variant="subtitle1"
            sx={{
              mb: 1,
              fontWeight: 900,
            }}
          >
            Детализация по направлениям
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
                  <TableCell align="right">
                    Средний по ВПП
                  </TableCell>
                  <TableCell align="right">
                    Мест
                  </TableCell>
                  <TableCell align="right">
                    ВПП
                  </TableCell>
                  <TableCell align="right">
                    БВИ
                  </TableCell>
                  <TableCell align="right">
                    Не хватает ВПП
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {directions.map((row) => (
                  <TableRow key={row.direction_code}>
                    <TableCell
                      sx={{
                        whiteSpace: 'nowrap',
                        fontWeight: 800,
                      }}
                    >
                      {row.direction_code}
                    </TableCell>

                    <TableCell sx={{ minWidth: 280 }}>
                      {row.direction_name}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{ fontWeight: 800 }}
                    >
                      {formatScore(
                        row.average_score_by_vpp_count
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.admission_plan)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(
                        row.plan_applications_count
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(row.no_exams_count)}
                    </TableCell>

                    <TableCell align="right">
                      {numberOrDash(
                        row.plan_missing_count
                      )}
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

export default NewModelDirectionsStats;