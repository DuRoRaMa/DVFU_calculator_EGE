import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  getDirectionApplicants,
  getDirectionStats,
  getImportSettings,
  getImportStatus,
  getUniversityStats,
  runImport,
  updateImportSettings,
} from '../services/api';

const MonitoringPage = ({ user }) => {
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [applicants, setApplicants] = useState([]);

  const [importStatus, setImportStatus] = useState(null);
  const [universityStats, setUniversityStats] = useState(null);
  const [importSettings, setImportSettings] = useState({
    update_interval_minutes: 30,
    is_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDirections = async () => {
    const response = await getDirectionStats();
    setDirections(response.data);
  };

  const loadImportStatus = async () => {
    const response = await getImportStatus();
    setImportStatus(response.data);
  };

  const loadAdminData = async () => {
    if (!isAdmin) {
      return;
    }

    const [universityResponse, settingsResponse] = await Promise.all([
      getUniversityStats(),
      getImportSettings(),
    ]);

    setUniversityStats(universityResponse.data);
    setImportSettings(settingsResponse.data);
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadDirections(),
        loadImportStatus(),
        loadAdminData(),
      ]);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить данные мониторинга');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();

    const intervalId = setInterval(() => {
      loadImportStatus().catch(console.error);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSelectDirection = async (direction) => {
    try {
      setSelectedDirection(direction);
      setApplicantsLoading(true);
      setError(null);

      const response = await getDirectionApplicants(direction.direction_code);
      setApplicants(response.data);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить список абитуриентов');
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleRunImport = async () => {
    try {
      setAdminLoading(true);
      setError(null);

      await runImport();
      await loadPageData();
    } catch (err) {
      console.error(err);
      setError('Не удалось запустить обновление данных');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setAdminLoading(true);
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
      setAdminLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2} mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Мониторинг среднего балла
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {importStatus?.is_updating && (
          <Alert severity="info">
            Идет обновление данных. Часть показателей может временно обновляться.
          </Alert>
        )}

        {importStatus && (
          <Alert severity={importStatus.status === 'failed' ? 'error' : 'success'}>
            Последнее обновление: {formatDateTime(importStatus.finished_at || importStatus.started_at)}.
            Загружено записей: {importStatus.total_loaded || 0}.
          </Alert>
        )}
      </Stack>

      {isAdmin && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Средний балл по университету
                </Typography>

                <Typography variant="h3" mt={1}>
                  {universityStats?.avg_score ?? 0}
                </Typography>

                <Typography color="text.secondary">
                  Абитуриентов с высшим приоритетом: {universityStats?.applicants_count ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Настройки обновления
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
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
                    <Typography>
                      Автообновление
                    </Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={handleSaveSettings}
                    disabled={adminLoading}
                  >
                    Сохранить
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleRunImport}
                    disabled={adminLoading || importStatus?.is_updating}
                  >
                    Запустить обновление
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={selectedDirection ? 6 : 12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Направления
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Код</TableCell>
                  <TableCell>Направление</TableCell>
                  <TableCell align="right">Средний балл</TableCell>
                  <TableCell align="right">Абитуриентов</TableCell>
                  <TableCell align="right">Согласий</TableCell>
                  <TableCell align="right">ВПР без оригинала</TableCell>
                  <TableCell align="right">Высший приоритет</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {directions.map((direction) => (
                  <TableRow
                    key={`${direction.direction_code}-${direction.direction_name}`}
                    hover
                    selected={selectedDirection?.direction_code === direction.direction_code}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleSelectDirection(direction)}
                  >
                    <TableCell>{direction.direction_code}</TableCell>
                    <TableCell>{direction.direction_name}</TableCell>
                    <TableCell align="right">{direction.avg_score}</TableCell>
                    <TableCell align="right">{direction.applicants_count}</TableCell>
                    <TableCell align="right">{direction.approval_count}</TableCell>
                    <TableCell align="right">{direction.high_priority_no_original_count}</TableCell>
                    <TableCell align="right">{direction.top_priority_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {selectedDirection && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6">
                    Абитуриенты
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDirection.direction_code} — {selectedDirection.direction_name}
                  </Typography>
                </Box>

                <Button variant="text" onClick={() => setSelectedDirection(null)}>
                  Закрыть
                </Button>
              </Stack>

              {applicantsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ФИО</TableCell>
                      <TableCell align="right">Средний балл</TableCell>
                      <TableCell>Статусы</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {applicants.map((applicant) => (
                      <TableRow key={`${applicant.student_id}-${applicant.student_name}`}>
                        <TableCell>{applicant.student_name}</TableCell>
                        <TableCell align="right">{applicant.avg_score}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {applicant.approval && (
                              <Chip size="small" label="Согласие" color="success" />
                            )}

                            {applicant.top_priority && (
                              <Chip size="small" label="Высший приоритет" color="primary" />
                            )}

                            {applicant.high_priority_no_original && (
                              <Chip size="small" label="ВПР без оригинала" color="warning" />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MonitoringPage;
