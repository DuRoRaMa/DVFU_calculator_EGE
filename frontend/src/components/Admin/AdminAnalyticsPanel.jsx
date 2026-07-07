import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
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
  testImportConnection,
  updateImportSettings,
} from '../../services/api';

const STATUS_LABELS = {
  never: 'Импорт ещё не выполнялся',
  pending: 'В очереди',
  running: 'Выполняется',
  success: 'Успешно',
  failed: 'Ошибка',
  skipped: 'Пропущено',
};

const DEFAULT_IMPORT_SETTINGS = {
  source_type: 'soap',
  service_url: '',
  soap_action: '',
  service_login: '',
  service_password: '',
  soap_timeout_seconds: 60,
  verify_ssl: true,
  update_interval_minutes: 30,
  is_enabled: false,
};

const normalizeImportSettings = (settings) => {
  return {
    ...DEFAULT_IMPORT_SETTINGS,
    ...settings,
    service_password: '',
    soap_timeout_seconds: Number(settings?.soap_timeout_seconds || 60),
    update_interval_minutes: Number(settings?.update_interval_minutes || 30),
    verify_ssl: Boolean(settings?.verify_ssl),
    is_enabled: Boolean(settings?.is_enabled),
  };
};

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('ru-RU');
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.message) {
    return data.message;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstValue = Object.values(data)[0];

  if (Array.isArray(firstValue)) {
    return firstValue.join(' ');
  }

  if (typeof firstValue === 'string') {
    return firstValue;
  }

  return fallback;
};

const AdminAnalyticsPanel = () => {
  const [isAvailableForUser, setIsAvailableForUser] = useState(false);

  const [directions, setDirections] = useState([]);
  const [universityStats, setUniversityStats] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importSettings, setImportSettings] = useState(DEFAULT_IMPORT_SETTINGS);
  const [settingsMeta, setSettingsMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isSoap = importSettings.source_type === 'soap';

  const isImportActive = (
    importStatus?.status === 'pending' ||
    importStatus?.status === 'running'
  );

  const analytics = useMemo(() => {
    const totalApplicants = directions.reduce(
      (sum, direction) => sum + Number(direction.total_applications || 0),
      0
    );

    const approvalCount = directions.reduce(
      (sum, direction) => sum + Number(direction.approvals_count || 0),
      0
    );

    const topPriorityCount = directions.reduce(
      (sum, direction) => sum + Number(direction.top_priority_count || 0),
      0
    );

    const highPriorityNoOriginalCount = directions.reduce(
      (sum, direction) => (
        sum + Number(direction.high_priority_no_original_count || 0)
      ),
      0
    );

    const weightedScoreSum = directions.reduce((sum, direction) => {
      return (
        sum +
        Number(direction.average_score || 0) *
          Number(direction.total_applications || 0)
      );
    }, 0);

    const avgScoreAll = totalApplicants
      ? weightedScoreSum / totalApplicants
      : 0;

    const topByScore = [...directions]
      .sort((a, b) => Number(b.average_score || 0) - Number(a.average_score || 0))
      .slice(0, 10);

    const topByApplicants = [...directions]
      .sort((a, b) => (
        Number(b.total_applications || 0) -
        Number(a.total_applications || 0)
      ))
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
      setSettingsMeta(settingsResponse.data);
      setImportSettings(normalizeImportSettings(settingsResponse.data));
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

  const refreshImportStatus = async () => {
    try {
      const response = await getImportStatus();
      setImportStatus(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (!isImportActive) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshImportStatus();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isImportActive]);

  const handleSettingsChange = (field, value) => {
    setImportSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRunImport = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await runImport();

      setSuccessMessage(response.data.message || 'Импорт поставлен в очередь.');

      await refreshImportStatus();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Не удалось запустить обновление данных'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        ...importSettings,
        soap_timeout_seconds: Number(importSettings.soap_timeout_seconds),
        update_interval_minutes: Number(importSettings.update_interval_minutes),
        verify_ssl: Boolean(importSettings.verify_ssl),
        is_enabled: Boolean(importSettings.is_enabled),
      };

      if (!payload.service_password) {
        delete payload.service_password;
      }

      const response = await updateImportSettings(payload);

      setSettingsMeta(response.data);
      setImportSettings(normalizeImportSettings(response.data));
      setSuccessMessage('Настройки импорта сохранены.');
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Не удалось сохранить настройки обновления'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await testImportConnection();

      setSuccessMessage(
        `${response.data.message}. Получено записей: ${response.data.items_count}.`
      );
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Не удалось проверить подключение'));
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!isAvailableForUser) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Админская аналитика
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Общие показатели по приемной кампании и управление обновлением данных.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {isImportActive && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Импорт выполняется в фоне. Статус обновляется автоматически каждые 5 секунд.
        </Alert>
      )}

      {importStatus && (
        <Alert severity={importStatus.status === 'failed' ? 'error' : 'info'} sx={{ mb: 3 }}>
          Последний импорт: {STATUS_LABELS[importStatus.status] || importStatus.status}.
          {' '}
          Последнее обновление: {formatDateTime(importStatus.finished_at || importStatus.started_at)}.
          {' '}
          Загружено записей: {importStatus.total_loaded || 0}.
          {importStatus.error_message ? ` Ошибка: ${importStatus.error_message}` : ''}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Средний балл по университету
            </Typography>

            <Typography variant="h4">
              {universityStats?.average_score ?? 0}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              По загруженным заявлениям
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Средний балл по направлениям
            </Typography>

            <Typography variant="h4">
              {analytics.avgScoreAll}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Взвешенный по количеству заявлений
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Заявлений
            </Typography>

            <Typography variant="h4">
              {analytics.totalApplicants}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Направлений: {analytics.totalDirections}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Согласия и приоритеты
            </Typography>

            <Typography variant="body1">
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
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 1.2fr) minmax(340px, 0.8fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Настройки импорта
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              label="Тип источника"
              value={importSettings.source_type}
              onChange={(event) => handleSettingsChange('source_type', event.target.value)}
              fullWidth
            >
              <MenuItem value="local_json">
                Локальный JSON
              </MenuItem>

              <MenuItem value="soap">
                SOAP-сервис
              </MenuItem>
            </TextField>

            {isSoap && (
              <>
                <TextField
                  label="Адрес SOAP-сервиса"
                  value={importSettings.service_url}
                  onChange={(event) => handleSettingsChange('service_url', event.target.value)}
                  fullWidth
                />

                <TextField
                  label="SOAPAction"
                  value={importSettings.soap_action}
                  onChange={(event) => handleSettingsChange('soap_action', event.target.value)}
                  fullWidth
                  helperText="Можно оставить пустым, если сервис не требует SOAPAction"
                />

                <TextField
                  label="Логин SOAP-сервиса"
                  value={importSettings.service_login}
                  onChange={(event) => handleSettingsChange('service_login', event.target.value)}
                  fullWidth
                  autoComplete="username"
                />

                <TextField
                  label="Пароль SOAP-сервиса"
                  type="password"
                  value={importSettings.service_password}
                  onChange={(event) => handleSettingsChange('service_password', event.target.value)}
                  fullWidth
                  autoComplete="new-password"
                  helperText={
                    settingsMeta?.service_password_is_set
                      ? 'Пароль уже сохранён. Оставьте поле пустым, чтобы не менять его.'
                      : 'Введите пароль для SOAP-сервиса.'
                  }
                />

                <TextField
                  label="Таймаут SOAP-запроса, секунд"
                  type="number"
                  value={importSettings.soap_timeout_seconds}
                  onChange={(event) => handleSettingsChange('soap_timeout_seconds', event.target.value)}
                  fullWidth
                  inputProps={{
                    min: 5,
                    max: 600,
                  }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(importSettings.verify_ssl)}
                      onChange={(event) => handleSettingsChange('verify_ssl', event.target.checked)}
                    />
                  }
                  label="Проверять SSL-сертификат"
                />
              </>
            )}

            <Divider />

            <TextField
              select
              label="Периодичность автоимпорта"
              value={Number(importSettings.update_interval_minutes)}
              onChange={(event) => handleSettingsChange('update_interval_minutes', Number(event.target.value))}
              fullWidth
            >
              <MenuItem value={30}>
                Раз в 30 минут
              </MenuItem>

              <MenuItem value={60}>
                Раз в 1 час
              </MenuItem>

              <MenuItem value={180}>
                Раз в 3 часа
              </MenuItem>

              <MenuItem value={1440}>
                Раз в сутки
              </MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(importSettings.is_enabled)}
                  onChange={(event) => handleSettingsChange('is_enabled', event.target.checked)}
                />
              }
              label="Автоимпорт включён"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                disabled={actionLoading}
              >
                Сохранить настройки
              </Button>

              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testLoading}
              >
                {testLoading ? (
                  <CircularProgress size={22} />
                ) : (
                  'Проверить подключение'
                )}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Состояние импорта
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <InfoRow
              label="Статус"
              value={STATUS_LABELS[importStatus?.status] || importStatus?.status || '—'}
            />

            <InfoRow
              label="Тип запуска"
              value={importStatus?.trigger_label || importStatus?.trigger || '—'}
            />

            <InfoRow
              label="Плановое время"
              value={formatDateTime(importStatus?.scheduled_for)}
            />

            <InfoRow
              label="Начало"
              value={formatDateTime(importStatus?.started_at)}
            />

            <InfoRow
              label="Окончание"
              value={formatDateTime(importStatus?.finished_at)}
            />

            <InfoRow
              label="Получено из источника"
              value={importStatus?.total_received ?? '—'}
            />

            <InfoRow
              label="Загружено подходящих"
              value={importStatus?.total_loaded ?? '—'}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="contained"
              onClick={handleRunImport}
              disabled={actionLoading || isImportActive}
            >
              {actionLoading ? (
                <CircularProgress size={22} />
              ) : (
                'Запустить импорт'
              )}
            </Button>

            <Button variant="outlined" onClick={refreshImportStatus}>
              Обновить статус
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 1fr',
          },
          gap: 3,
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Топ направлений по среднему баллу
          </Typography>

          <DirectionsTable
            rows={analytics.topByScore}
            columns={[
              {
                key: 'direction_code',
                label: 'Код',
              },
              {
                key: 'direction_name',
                label: 'Направление',
              },
              {
                key: 'average_score',
                label: 'Средний балл',
              },
              {
                key: 'total_applications',
                label: 'Заявлений',
              },
            ]}
          />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Топ направлений по количеству заявлений
          </Typography>

          <DirectionsTable
            rows={analytics.topByApplicants}
            columns={[
              {
                key: 'direction_code',
                label: 'Код',
              },
              {
                key: 'direction_name',
                label: 'Направление',
              },
              {
                key: 'total_applications',
                label: 'Заявлений',
              },
              {
                key: 'approvals_count',
                label: 'Согласий',
              },
            ]}
          />
        </Paper>
      </Box>
    </Box>
  );
};

const InfoRow = ({
  label,
  value,
}) => {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body1" fontWeight={600}>
        {value || '—'}
      </Typography>
    </Box>
  );
};

const DirectionsTable = ({
  rows,
  columns,
}) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell key={column.key}>
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.direction_code}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {row[column.key] ?? '—'}
              </TableCell>
            ))}
          </TableRow>
        ))}

        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={columns.length}>
              Нет данных
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default AdminAnalyticsPanel;