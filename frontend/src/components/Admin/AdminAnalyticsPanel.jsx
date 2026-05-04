import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import {
  getDirectionStats,
  getImportSettings,
  getImportStatus,
  getUniversityStats,
  runImport,
  updateImportSettings,
} from '../../services/api';

const AdminAnalyticsPanel = () => {
  const [isAvailableForUser, setIsAvailableForUser] = useState(false);

  const [directions, setDirections] = useState([]);
  const [universityStats, setUniversityStats] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importSettings, setImportSettings] = useState({
    update_interval_minutes: 30,
    is_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const analytics = useMemo(() => {
    const totalApplicants = directions.reduce(
      (sum, direction) => sum + Number(direction.applicants_count || 0),
      0
    );

    const approvalCount = directions.reduce(
      (sum, direction) => sum + Number(direction.approval_count || 0),
      0
    );

    const topPriorityCount = directions.reduce(
      (sum, direction) => sum + Number(direction.top_priority_count || 0),
      0
    );

    const highPriorityNoOriginalCount = directions.reduce(
      (sum, direction) =>
        sum + Number(direction.high_priority_no_original_count || 0),
      0
    );

    const weightedScoreSum = directions.reduce((sum, direction) => {
      return (
        sum +
        Number(direction.avg_score || 0) *
          Number(direction.applicants_count || 0)
      );
    }, 0);

    const avgScoreAll = totalApplicants
      ? weightedScoreSum / totalApplicants
      : 0;

    const topByScore = [...directions]
      .sort((a, b) => Number(b.avg_score || 0) - Number(a.avg_score || 0))
      .slice(0, 10);

    const topByApplicants = [...directions]
      .sort(
        (a, b) =>
          Number(b.applicants_count || 0) -
          Number(a.applicants_count || 0)
      )
      .slice(0, 10);

    return {
      totalApplicants,
      totalDirections: directions.length,
      approvalCount,
      topPriorityCount,
      highPriorityNoOriginalCount,
      avgScoreAll: Number(avgScoreAll.toFixed(2)),
      topByScore,
      topByApplicants,
    };
  }, [directions]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        directionsResponse,
        universityResponse,
        statusResponse,
        settingsResponse,
      ] = await Promise.all([
        getDirectionStats(),
        getUniversityStats(),
        getImportStatus(),
        getImportSettings(),
      ]);

      setDirections(directionsResponse.data);
      setUniversityStats(universityResponse.data);
      setImportStatus(statusResponse.data);
      setImportSettings(settingsResponse.data);
      setIsAvailableForUser(true);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setIsAvailableForUser(false);
        return;
      }

      setIsAvailableForUser(true);
      setError('Не удалось загрузить админскую аналитику');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRunImport = async () => {
    try {
      setActionLoading(true);
      setError(null);

      await runImport();
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setError('Не удалось запустить обновление данных');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await updateImportSettings({
        update_interval_minutes: Number(importSettings.update_interval_minutes),
        is_enabled: Boolean(importSettings.is_enabled),
      });

      setImportSettings(response.data);
    } catch (err) {
      console.error(err);
      setError('Не удалось сохранить настройки обновления');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString('ru-RU');
  };

  if (loading) {
    return null;
  }

  if (!isAvailableForUser) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Админская аналитика
          </Typography>

          <Typography color="text.secondary">
            Общие показатели по приемной кампании и управление обновлением
            данных.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {importStatus?.is_updating && (
          <Alert severity="info">
            Идет обновление данных. Пользователи видят сообщение об
            обновлении.
          </Alert>
        )}

        {importStatus && (
          <Alert
            severity={importStatus.status === 'failed' ? 'error' : 'success'}
          >
            Последнее обновление:{' '}
            {formatDateTime(importStatus.finished_at || importStatus.started_at)}.
            Загружено записей: {importStatus.total_loaded || 0}.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">
                  Средний балл по университету
                </Typography>

                <Typography variant="h3" fontWeight={700}>
                  {universityStats?.avg_score ?? 0}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Только с высшим приоритетом
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">
                  Средний балл по всем заявлениям
                </Typography>

                <Typography variant="h3" fontWeight={700}>
                  {analytics.avgScoreAll}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">
                  Заявлений
                </Typography>

                <Typography variant="h3" fontWeight={700}>
                  {analytics.totalApplicants}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Направлений: {analytics.totalDirections}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">
                  Согласия и приоритеты
                </Typography>

                <Typography variant="h5" fontWeight={700}>
                  {analytics.approvalCount} согласий
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Высший приоритет: {analytics.topPriorityCount}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  ВПР без оригинала: {analytics.highPriorityNoOriginalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, borderRadius: 3 }} variant="outlined">
          <Typography variant="h6" mb={2}>
            Настройки обновления
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Интервал обновления, минут"
              type="number"
              value={importSettings.update_interval_minutes}
              onChange={(event) =>
                setImportSettings((prev) => ({
                  ...prev,
                  update_interval_minutes: event.target.value,
                }))
              }
              inputProps={{ min: 1 }}
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <Switch
                checked={Boolean(importSettings.is_enabled)}
                onChange={(event) =>
                  setImportSettings((prev) => ({
                    ...prev,
                    is_enabled: event.target.checked,
                  }))
                }
              />

              <Typography>Автообновление</Typography>
            </Stack>

            <Button
              variant="contained"
              onClick={handleSaveSettings}
              disabled={actionLoading}
            >
              Сохранить
            </Button>

            <Button
              variant="outlined"
              onClick={handleRunImport}
              disabled={actionLoading || importStatus?.is_updating}
            >
              {actionLoading ? (
                <CircularProgress size={20} />
              ) : (
                'Запустить обновление'
              )}
            </Button>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3 }} variant="outlined">
              <Typography variant="h6" mb={2}>
                Топ направлений по среднему баллу
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Код</TableCell>
                    <TableCell>Направление</TableCell>
                    <TableCell align="right">Средний балл</TableCell>
                    <TableCell align="right">Абитуриентов</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {analytics.topByScore.map((direction) => (
                    <TableRow
                      key={`score-${direction.direction_code}-${direction.direction_name}`}
                    >
                      <TableCell>{direction.direction_code}</TableCell>
                      <TableCell>{direction.direction_name}</TableCell>
                      <TableCell align="right">
                        {direction.avg_score}
                      </TableCell>
                      <TableCell align="right">
                        {direction.applicants_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3 }} variant="outlined">
              <Typography variant="h6" mb={2}>
                Топ направлений по количеству абитуриентов
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Код</TableCell>
                    <TableCell>Направление</TableCell>
                    <TableCell align="right">Абитуриентов</TableCell>
                    <TableCell align="right">Согласий</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {analytics.topByApplicants.map((direction) => (
                    <TableRow
                      key={`count-${direction.direction_code}-${direction.direction_name}`}
                    >
                      <TableCell>{direction.direction_code}</TableCell>
                      <TableCell>{direction.direction_name}</TableCell>
                      <TableCell align="right">
                        {direction.applicants_count}
                      </TableCell>
                      <TableCell align="right">
                        {direction.approval_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
};

export default AdminAnalyticsPanel;
