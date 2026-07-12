import React from 'react';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  getCurrentUserFromStorage,
  isAdminUser,
} from '../../services/api';

import DirectionVppAverageDynamics from './DirectionVppAverageDynamics';

const numberOrDash = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return value;
};

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(2);
};

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return numberValue;
};

const getMonitoringValue = (monitoring, newKey, oldKey, fallback = 0) => {
  if (!monitoring) {
    return fallback;
  }

  if (monitoring[newKey] !== undefined && monitoring[newKey] !== null) {
    return monitoring[newKey];
  }

  if (oldKey && monitoring[oldKey] !== undefined && monitoring[oldKey] !== null) {
    return monitoring[oldKey];
  }

  return fallback;
};

const StatCard = ({
  icon,
  label,
  value,
  caption,
  tone = 'default',
  tooltip = '',
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
        p: { xs: 1.75, sm: 2 },
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
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ lineHeight: 1.25 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.25 }}
            >
              {label}
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
            variant="h5"
            className="program-card-number"
            sx={{
              mt: 0.35,
              fontWeight: 800,
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

const VppPlanStatusBlock = ({
  admissionPlan,
  planApplicationsCount,
  planMissingCount,
  planFillPercent,
  isVppPlanClosed,
}) => {
  const hasPlan = admissionPlan > 0;

  if (!hasPlan) {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <WarningAmberIcon
            fontSize="small"
            sx={{ mt: 0.15, color: '#b91c1c' }}
          />

          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 900,
                color: '#991b1b',
              }}
            >
              План набора не задан
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.4,
                color: '#991b1b',
              }}
            >
              Невозможно проверить закрытие общего конкурса по ВПП.
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        backgroundColor: isVppPlanClosed ? '#ecfdf3' : '#fffbeb',
        border: '1px solid',
        borderColor: isVppPlanClosed ? '#bbf7d0' : '#fde68a',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box
          sx={{
            mt: 0.15,
            display: 'flex',
            color: isVppPlanClosed ? '#15803d' : '#b45309',
          }}
        >
          {isVppPlanClosed ? (
            <CheckCircleIcon fontSize="small" />
          ) : (
            <WarningAmberIcon fontSize="small" />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 900,
                color: isVppPlanClosed ? '#166534' : '#92400e',
              }}
            >
              {isVppPlanClosed
                ? 'Общий конкурс закрыт ВПП'
                : `Не хватает ВПП: ${planMissingCount}`}
            </Typography>

            <Tooltip
              title="Проверка показывает, хватает ли заявлений с ВПП / высшим приоритетом для закрытия плана набора по общему конкурсу. Если ВПП меньше плана, показатель «Средний по плану» будет ниже, потому что сумма баллов делится на весь план набора."
              arrow
            >
              <InfoOutlinedIcon
                sx={{
                  fontSize: 16,
                  color: isVppPlanClosed ? '#166534' : '#92400e',
                  cursor: 'help',
                }}
              />
            </Tooltip>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              color: isVppPlanClosed ? '#166534' : '#92400e',
            }}
          >
            ВПП в плане: {planApplicationsCount} из {admissionPlan}
            {' '}
            · заполнено {formatScore(planFillPercent)}%
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

const ProgramHeader = ({
  program,
  selectedCount,
}) => {
  const isAdmin = isAdminUser(getCurrentUserFromStorage());
  const admissionPlan = Number(program.admission_plan || 0);
  const targetAvgScore = Number(program.target_avg_score || 0);

  const monitoring = program.monitoring;

  const monitoringAvgScoreByPlan = getMonitoringValue(
    monitoring,
    'average_score_by_plan',
    'average_score',
    null
  );

  const monitoringAvgScoreByVppCount = getMonitoringValue(
    monitoring,
    'average_score_by_vpp_count',
    'average_score_by_vpp_count',
    null
  );

  const monitoringApplicants = getMonitoringValue(
    monitoring,
    'total_applications',
    'applicants_count',
    null
  );

  const monitoringApprovals = getMonitoringValue(
    monitoring,
    'approvals_count',
    'approval_count',
    null
  );

  const monitoringTopPriority = getMonitoringValue(
    monitoring,
    'top_priority_count',
    'top_priority_count',
    null
  );

  const planApplicationsCount = toNumber(
    getMonitoringValue(
      monitoring,
      'plan_applications_count',
      'plan_applications_count',
      0
    )
  );

  const planMissingFromApi = getMonitoringValue(
    monitoring,
    'plan_missing_count',
    'plan_missing_count',
    null
  );

  const planMissingCount = planMissingFromApi !== null
    ? toNumber(planMissingFromApi, 0)
    : Math.max(admissionPlan - planApplicationsCount, 0);

  const planFillPercent = toNumber(
    getMonitoringValue(
      monitoring,
      'plan_fill_percent',
      'plan_fill_percent',
      admissionPlan > 0 ? (planApplicationsCount / admissionPlan) * 100 : 0
    )
  );

  const isVppPlanClosed = admissionPlan > 0 && planMissingCount <= 0;

  const selectedTone = admissionPlan > 0 && selectedCount > admissionPlan
    ? 'danger'
    : 'success';

  const selectedCaption = (() => {
    if (admissionPlan <= 0) {
      return 'План не задан';
    }

    if (selectedCount > admissionPlan) {
      return 'План превышен';
    }

    if (selectedCount === admissionPlan) {
      return 'План заполнен';
    }

    return 'В пределах плана';
  })();

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        background:
          'linear-gradient(135deg, rgba(0,51,102,0.96) 0%, rgba(0,91,150,0.92) 48%, rgba(255,153,0,0.88) 100%)',
        color: 'white',
      }}
    >
      <Box
        sx={{
          p: { xs: 2.25, sm: 3, md: 3.5 },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 1.5 }}
            >
              <Chip
                icon={<SchoolIcon />}
                label="Расчёт среднего балла"
                size="small"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />

              {program.code && (
                <Chip
                  label={program.code}
                  size="small"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                  }}
                />
              )}

              {program.school_label && (
                <Chip
                  label={program.school_label}
                  size="small"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 900,
                lineHeight: 1.12,
                fontSize: {
                  xs: '1.55rem',
                  sm: '2rem',
                  md: '2.25rem',
                },
                overflowWrap: 'anywhere',
              }}
            >
              {program.name}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: 'rgba(255,255,255,0.86)',
                maxWidth: 820,
              }}
            >
              Выберите абитуриентов в пределах плана набора и рассчитайте средний балл выборки.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          backgroundColor: '#f8fafc',
          color: 'text.primary',
        }}
      >
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<GroupsIcon />}
              label="План набора"
              value={`${admissionPlan} мест`}
              caption="Места общего конкурса"
              tooltip="План набора — количество мест по общему конкурсу для выбранного направления."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<EmojiEventsIcon />}
              label="Целевой балл"
              value={formatScore(targetAvgScore)}
              caption="Ориентир Приоритет-2030"
              tone="warning"
              tooltip="Целевой средний балл рассчитывается по правилам показателя Приоритет-2030: учитываются абитуриенты в пределах плана набора по общему конкурсу. Для БВИ используется 100, для обычных направлений учитываются ЕГЭ, для отдельных направлений — допустимые вступительные испытания."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<FactCheckIcon />}
              label="Выбрано вручную"
              value={`${selectedCount}/${admissionPlan}`}
              caption={selectedCaption}
              tone={selectedTone}
              tooltip="Это ручная выборка на странице расчёта. Она может отличаться от мониторинга ВПП, который считается автоматически по заявлениям с высшим приоритетом."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrendingUpIcon />}
              label="Средний балл по ВПП"
              value={formatScore(monitoringAvgScoreByVppCount)}
              caption="Средний балл найденных ВПП"
              tone="success"
              tooltip="Средний балл рассчитывается только по заявлениям с высшим проходным приоритетом, попавшим в расчёт в пределах плана набора."
            />
          </Grid>
        </Grid>

        {monitoring && (
          <Box
            sx={{
              mt: 2,
              p: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800 }}
              >
                Данные мониторинга по ВПП
              </Typography>

              <Tooltip
                title={
                  isAdmin
                    ? 'Для администратора показываются два показателя: средний по плану и фактический средний балл найденных ВПП.'
                    : 'Показывается фактический средний балл заявлений с ВПП в пределах плана набора.'
                }
                arrow
              >
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                    cursor: 'help',
                  }}
                />
              </Tooltip>
            </Stack>

            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <VppPlanStatusBlock
                  admissionPlan={admissionPlan}
                  planApplicationsCount={planApplicationsCount}
                  planMissingCount={planMissingCount}
                  planFillPercent={planFillPercent}
                  isVppPlanClosed={isVppPlanClosed}
                />
              </Grid>

              {isAdmin && (
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Средний по плану
                  </Typography>

                  <Typography
                    variant="h6"
                    className="program-card-number"
                    sx={{ fontWeight: 800 }}
                  >
                    {formatScore(monitoringAvgScoreByPlan)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Сумма баллов ВПП / план набора
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Средний по ВПП
                </Typography>

                <Typography
                  variant="h6"
                  className="program-card-number"
                  sx={{ fontWeight: 800 }}
                >
                  {formatScore(monitoringAvgScoreByVppCount)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Сумма ВПП / количество ВПП
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  ВПП в плане
                </Typography>

                <Typography
                  variant="h6"
                  className="program-card-number"
                  sx={{ fontWeight: 800 }}
                >
                  {admissionPlan > 0
                    ? `${planApplicationsCount}/${admissionPlan}`
                    : '—'}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Заполнено {formatScore(planFillPercent)}%
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Согласий
                </Typography>

                <Typography
                  variant="h6"
                  className="program-card-number"
                  sx={{ fontWeight: 800 }}
                >
                  {numberOrDash(monitoringApprovals)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Всего заявлений: {numberOrDash(monitoringApplicants)}
                </Typography>
              </Grid>

              {monitoringTopPriority !== null && monitoringTopPriority !== undefined && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Всего заявлений с высшим приоритетом: {monitoringTopPriority}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Box>

          {isAdmin && program?.code && (
            <Box sx={{ mt: 2 }}>
              <DirectionVppAverageDynamics
                directionCode={program.code}
              />
            </Box>
          )}
    </Paper>
  );
};

export default ProgramHeader;
