import React from 'react';
import {
  Box,
  Chip,
  Grid,
  Tooltip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';

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

const getMonitoringValue = (monitoring, newKey, oldKey, fallback = 0) => {
  if (!monitoring) {
    return fallback;
  }

  if (monitoring[newKey] !== undefined && monitoring[newKey] !== null) {
    return monitoring[newKey];
  }

  if (monitoring[oldKey] !== undefined && monitoring[oldKey] !== null) {
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
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.25 }}
          >
            {label}
          </Typography>

          <Typography
            variant="h5"
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

const ProgramHeader = ({
  program,
  selectedCount,
}) => {
  const admissionPlan = Number(program.admission_plan || 0);
  const targetAvgScore = Number(program.target_avg_score || 0);
  const availablePlaces = Math.max(admissionPlan - selectedCount, 0);

  const monitoring = program.monitoring;

  const monitoringAvgScore = getMonitoringValue(
    monitoring,
    'average_score',
    'avg_score',
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

  const selectedTone = selectedCount > admissionPlan ? 'danger' : 'success';

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
              Выберите абитуриентов в пределах плана приёма и рассчитайте средний балл выборки.
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
              label="План приёма"
              value={`${admissionPlan} мест`}
              caption={`Доступно: ${availablePlaces}`}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<EmojiEventsIcon />}
              label="Целевой балл"
              value={formatScore(targetAvgScore)}
              caption="Ориентир для набора"
              tone="warning"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<FactCheckIcon />}
              label="Выбрано"
              value={`${selectedCount}/${admissionPlan}`}
              caption={selectedCount > admissionPlan ? 'План превышен' : 'В пределах плана'}
              tone={selectedTone}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrendingUpIcon />}
              label="Средний по ВПП по мониторингу"
              value={formatScore(monitoringAvgScore)}
              caption="По загруженным заявлениям с ВПП"
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
              sx={{ mb: 1 }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800 }}
              >
                Данные мониторинга по ВПП
              </Typography>

              <Tooltip
                title="Средний балл считается только по заявлениям с ВПП / высшим приоритетом. Абитуриенты и согласия ниже показываются справочно по направлению."
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
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Средний балл по ВПП
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {formatScore(monitoringAvgScore)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Абитуриентов
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {numberOrDash(monitoringApplicants)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Согласий
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {numberOrDash(monitoringApprovals)}
                </Typography>
              </Grid>

              {monitoringTopPriority !== null && monitoringTopPriority !== undefined && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Высший приоритет: {monitoringTopPriority}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ProgramHeader;
