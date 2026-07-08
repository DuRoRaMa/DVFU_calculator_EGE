import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Tooltip,
  Typography,
} from '@mui/material';
import PriorityDirectionsStats from './PriorityDirectionsStats';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import UniversityVppAverageDynamics from './UniversityVppAverageDynamics';
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

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(2);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0.00%';
  }

  return `${Number(value).toFixed(2)}%`;
};

const numberOrZero = (value) => {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
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

const StatCard = ({
  title,
  value,
  caption,
  tooltip,
  tone = 'default',
  icon = null,
}) => {
  const toneMap = {
    default: {
      borderColor: '#e5e7eb',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      valueColor: 'text.primary',
      iconColor: '#1d4ed8',
      iconBg: '#eff6ff',
    },
    success: {
      borderColor: '#bbf7d0',
      background: 'linear-gradient(135deg, #ecfdf3 0%, #ffffff 100%)',
      valueColor: '#15803d',
      iconColor: '#15803d',
      iconBg: '#dcfce7',
    },
    warning: {
      borderColor: '#fde68a',
      background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
      valueColor: '#b45309',
      iconColor: '#b45309',
      iconBg: '#fef3c7',
    },
    danger: {
      borderColor: '#fecaca',
      background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      valueColor: '#b91c1c',
      iconColor: '#b91c1c',
      iconBg: '#fee2e2',
    },
  };

  const currentTone = toneMap[tone] || toneMap.default;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: currentTone.borderColor,
        background: currentTone.background,
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                flex: '0 0 auto',
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: currentTone.iconBg,
                color: currentTone.iconColor,
              }}
            >
              {icon}
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography color="text.secondary" sx={{ lineHeight: 1.25 }}>
                {title}
              </Typography>

              {tooltip && (
                <Tooltip title={tooltip} arrow>
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      cursor: 'help',
                    }}
                  />
                </Tooltip>
              )}
            </Stack>

            <Typography
              variant="h4"
              className="metric-number"
              sx={{
                mt: 1,
                fontWeight: 900,
                color: currentTone.valueColor,
                lineHeight: 1.1,
                wordBreak: 'break-word',
              }}
            >
              {value}
            </Typography>

            {caption && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                {caption}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
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

    const missingVppDirectionsCount = directions.filter((direction) => {
      return Number(direction.plan_missing_count || 0) > 0;
    }).length;

    const closedVppDirectionsCount = directions.filter((direction) => {
      return (
        Number(direction.admission_plan || 0) > 0 &&
        Number(direction.plan_missing_count || 0) <= 0
      );
    }).length;

    const topByScore = [...directions]
      .sort((a, b) => (
        Number(b.average_score_by_plan ?? b.average_score ?? 0) -
        Number(a.average_score_by_plan ?? a.average_score ?? 0)
      ))
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
      missingVppDirectionsCount,
      closedVppDirectionsCount,
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

  const planMissingCount = numberOrZero(universityStats?.plan_missing_count);
  const isUniversityPlanClosed = planMissingCount <= 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Админская аналитика
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Общие показатели по приёмной кампании, контроль ВПП и управление обновлением данных.
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
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          title="Средний по плану"
          value={formatScore(
            universityStats?.average_score_by_plan ?? universityStats?.average_score
          )}
          caption="Сумма ВПП / общий план набора"
          tooltip="Считается как сумма средних баллов ВПП в пределах планов набора, делённая на общий план набора по университету. Если ВПП меньше плана, показатель снижается."
          tone={isUniversityPlanClosed ? 'success' : 'warning'}
          icon={
            isUniversityPlanClosed
              ? <CheckCircleIcon fontSize="small" />
              : <WarningAmberIcon fontSize="small" />
          }
        />

        <StatCard
          title="Средний по ВПП"
          value={formatScore(universityStats?.average_score_by_vpp_count)}
          caption="Сумма ВПП / количество ВПП"
          tooltip="Считается как сумма средних баллов ВПП в пределах планов набора, делённая только на количество ВПП. Показывает фактическое качество уже имеющихся ВПП без штрафа за незакрытый план."
          tone="success"
          icon={<CheckCircleIcon fontSize="small" />}
        />

        <StatCard
          title="Заполнение плана ВПП"
          value={`${universityStats?.plan_applications_count ?? 0}/${universityStats?.total_admission_plan ?? 0}`}
          caption={`Заполнено: ${formatPercent(universityStats?.plan_fill_percent)}`}
          tooltip="Показывает, сколько мест общего конкурса уже закрыто заявлениями с ВПП / высшим приоритетом в пределах планов набора."
          tone={isUniversityPlanClosed ? 'success' : 'warning'}
          icon={
            isUniversityPlanClosed
              ? <CheckCircleIcon fontSize="small" />
              : <WarningAmberIcon fontSize="small" />
          }
        />

        <StatCard
          title="Не хватает ВПП"
          value={planMissingCount}
          caption="Для закрытия общего конкурса"
          tooltip="Количество мест общего конкурса, которые пока не закрыты заявлениями с ВПП / высшим приоритетом."
          tone={planMissingCount > 0 ? 'warning' : 'success'}
          icon={
            planMissingCount > 0
              ? <WarningAmberIcon fontSize="small" />
              : <CheckCircleIcon fontSize="small" />
          }
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          title="Заявлений"
          value={analytics.totalApplicants}
          caption={`Направлений: ${analytics.totalDirections}`}
        />

        <StatCard
          title="Согласий"
          value={analytics.approvalCount}
          caption="По всем заявлениям"
        />

        <StatCard
          title="Высший приоритет"
          value={analytics.topPriorityCount}
          caption="Всего заявлений с ВПП"
        />

        <StatCard
          title="Направления с нехваткой ВПП"
          value={analytics.missingVppDirectionsCount}
          caption={`Закрыто: ${analytics.closedVppDirectionsCount}`}
          tone={analytics.missingVppDirectionsCount > 0 ? 'warning' : 'success'}
        />
      </Box>
      <Box sx={{ mb: 3 }}>
        <UniversityVppAverageDynamics />
        <PriorityDirectionsStats />
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
        <Paper sx={{ p: 3, borderRadius: 3, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Топ направлений по среднему по плану
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
                key: 'average_score_by_plan',
                label: 'По плану',
                render: (row) => formatScore(row.average_score_by_plan ?? row.average_score),
              },
              {
                key: 'average_score_by_vpp_count',
                label: 'По ВПП',
                render: (row) => formatScore(row.average_score_by_vpp_count),
              },
              {
                key: 'plan_applications_count',
                label: 'ВПП в плане',
                render: (row) => `${row.plan_applications_count ?? 0}/${row.admission_plan ?? 0}`,
              },
              {
                key: 'plan_missing_count',
                label: 'Статус',
                render: (row) => {
                  const missing = Number(row.plan_missing_count || 0);

                  return (
                    <Chip
                      size="small"
                      label={missing > 0 ? `Не хватает ${missing}` : 'Закрыто'}
                      color={missing > 0 ? 'warning' : 'success'}
                    />
                  );
                },
              },
            ]}
          />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3, overflowX: 'auto' }}>
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
              {
                key: 'average_score_by_plan',
                label: 'По плану',
                render: (row) => formatScore(row.average_score_by_plan ?? row.average_score),
              },
              {
                key: 'average_score_by_vpp_count',
                label: 'По ВПП',
                render: (row) => formatScore(row.average_score_by_vpp_count),
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
                {column.render ? column.render(row) : (row[column.key] ?? '—')}
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
