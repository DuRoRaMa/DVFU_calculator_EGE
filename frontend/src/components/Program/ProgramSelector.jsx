import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControlLabel,
  Tooltip,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalculateIcon from '@mui/icons-material/Calculate';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
  getCurrentUserFromStorage,
  isAdminUser,
} from '../../services/api';

const SCHOOL_OPTIONS = [
  'ИМКТ',
  'ШЭМ',
  'ШМиНЖ',
  'ИТПМ',
  'ИФКС',
  'ЮШ',
  'ШИГН',
  'ПИШ',
  'ШП',
  'ВИ',
  'ИМО',
  'ПИ',
];

const getSchoolName = (program) => {
  return program.school_label || program.school_name || program.school || 'Без школы';
};

const getMonitoringValue = (program, newKey, oldKey) => {
  const monitoring = program.monitoring;

  if (!monitoring) {
    return null;
  }

  if (monitoring[newKey] !== undefined && monitoring[newKey] !== null) {
    return monitoring[newKey];
  }

  if (monitoring[oldKey] !== undefined && monitoring[oldKey] !== null) {
    return monitoring[oldKey];
  }

  return null;
};
const getVppPlanStatus = (program) => {
  const admissionPlan = Number(program.admission_plan || 0);

  const planApplicationsCount = Number(
    getMonitoringValue(program, 'plan_applications_count', 'plan_applications_count') || 0
  );

  const planMissingCount = Number(
    getMonitoringValue(program, 'plan_missing_count', 'plan_missing_count') ||
      Math.max(admissionPlan - planApplicationsCount, 0)
  );

  const planFillPercent = Number(
    getMonitoringValue(program, 'plan_fill_percent', 'plan_fill_percent') || 0
  );

  const isClosed = admissionPlan > 0 && planMissingCount === 0;

  return {
    admissionPlan,
    planApplicationsCount,
    planMissingCount,
    planFillPercent,
    isClosed,
  };
};
const ProgramSelector = ({
  programs,
  onSelectProgram,
}) => {
  const navigate = useNavigate();
  const isAdmin = isAdminUser(getCurrentUserFromStorage());

  const [school, setSchool] = useState('');
  const [search, setSearch] = useState('');
  const [onlyPriority2030, setOnlyPriority2030] = useState(false);
  const [onlyNewModel, setOnlyNewModel] = useState(false);

  const goToCalculator = (program) => {
    onSelectProgram(program);
    navigate(`/calculate/${program.id}`);
  };

  const goToRecommendations = (program) => {
    onSelectProgram(program);
    navigate(`/recommendations/${program.id}`);
  };

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return programs.filter((program) => {
      const schoolName = getSchoolName(program);
      const matchesSchool = school === '' || schoolName === school;

      const searchText = [
        program.name,
        program.code,
        schoolName,
        program.education_level_label,
        program.study_form_label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchText.includes(normalizedSearch);

      let matchesSpecialFilter = true;

      if (onlyPriority2030 || onlyNewModel) {
        matchesSpecialFilter =
          (onlyPriority2030 && Boolean(program.is_priority_2030)) ||
          (onlyNewModel && Boolean(program.is_new_model));
      }

      return (
        matchesSchool &&
        matchesSearch &&
        matchesSpecialFilter
      );
    });
  }, [
    programs,
    school,
    search,
    onlyPriority2030,
    onlyNewModel,
  ]);
  const groupedPrograms = useMemo(() => {
    return filteredPrograms.reduce((acc, program) => {
      const schoolName = getSchoolName(program);

      if (!acc[schoolName]) {
        acc[schoolName] = [];
      }

      acc[schoolName].push(program);

      return acc;
    }, {});
  }, [filteredPrograms]);

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: 4,
          background:
            'linear-gradient(135deg, rgba(0,51,102,0.96) 0%, rgba(0,91,150,0.9) 58%, rgba(255,153,0,0.82) 100%)',
          color: 'white',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.6rem', sm: '2.1rem' },
            lineHeight: 1.15,
          }}
        >
          Выберите направление подготовки
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mt: 1,
            color: 'rgba(255,255,255,0.86)',
            maxWidth: 820,
          }}
        >
          Откройте расчёт по направлению, выберите абитуриентов и проверьте средний балл набора.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '280px minmax(0, 1fr) auto',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          select
          label="Институт"
          value={school}
          onChange={(event) => setSchool(event.target.value)}
          fullWidth
        >
          <MenuItem value="">
            Все школы
          </MenuItem>

          {SCHOOL_OPTIONS.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Поиск по названию или шифру"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
          placeholder="Например: 09.03.04 или программная инженерия"
        />

        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 0.75,
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #e5e7eb',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row', md: 'column' }}
            spacing={0}
          >
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={onlyPriority2030}
                  onChange={(event) =>
                    setOnlyPriority2030(event.target.checked)
                  }
                />
              }
              label="Приоритет 2030"
            />

            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={onlyNewModel}
                  onChange={(event) =>
                    setOnlyNewModel(event.target.checked)
                  }
                />
              }
              label="Новая модель"
            />
          </Stack>
        </Paper>
      </Box>

      {Object.entries(groupedPrograms).map(([schoolName, schoolPrograms]) => (
        <Box key={schoolName} sx={{ mb: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 2 }}
            useFlexGap
            flexWrap="wrap"
          >
            <SchoolIcon color="primary" />

            <Typography variant="h5" component="h2" sx={{ fontWeight: 900 }}>
              {schoolName}
            </Typography>

            <Chip label={`${schoolPrograms.length} направлений`} size="small" />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
              alignItems: 'stretch',
            }}
          >
            {schoolPrograms.map((program) => {
              const averageScoreByPlan = getMonitoringValue(
                program,
                'average_score_by_plan',
                'average_score'
              );

              const averageScoreByVppCount = getMonitoringValue(
                program,
                'average_score_by_vpp_count',
                'average_score_by_vpp_count'
              );

              const {
                admissionPlan,
                planApplicationsCount,
                planMissingCount,
                planFillPercent,
                isClosed,
              } = getVppPlanStatus(program);

              return (
                <Card
                  key={program.id}
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    transition: '0.18s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-3px)' },
                      boxShadow: '0 16px 34px rgba(15,23,42,0.10)',
                      borderColor: '#bfdbfe',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.25 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ mb: 1.5 }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        useFlexGap
                        flexWrap="wrap"
                      >
                        <Chip
                          label={program.code || '—'}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />

                        {program.is_priority_2030 && (
                          <Chip
                            label="Приоритет 2030"
                            size="small"
                            sx={{
                              fontWeight: 800,
                              color: '#1e40af',
                              backgroundColor: '#dbeafe',
                            }}
                          />
                        )}

                        {program.is_new_model && (
                          <Chip
                            label="Новая модель"
                            size="small"
                            sx={{
                              fontWeight: 800,
                              color: '#166534',
                              backgroundColor: '#dcfce7',
                            }}
                          />
                        )}
                      </Stack>

                      {program.study_form_label && (
                        <Chip
                          label={program.study_form_label}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 900,
                        lineHeight: 1.2,
                        mb: 1.5,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {program.name}
                    </Typography>

                    {program.education_level_label && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {program.education_level_label}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2.5,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #eef2f7',
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <GroupsIcon fontSize="small" color="primary" />

                          <Typography variant="caption" color="text.secondary">
                            План набора
                          </Typography>

                          <Tooltip
                            title="План набора — количество мест по общему конкурсу для выбранного направления. Именно от этого числа зависит, сколько абитуриентов нужно учитывать при расчёте целевого среднего балла."
                            arrow
                          >
                            <InfoOutlinedIcon
                              sx={{
                                fontSize: 16,
                                color: 'text.secondary',
                                cursor: 'help',
                              }}
                            />
                          </Tooltip>
                        </Stack>

                        <Typography
                          variant="h6"
                          className="program-card-number"
                          sx={{ fontWeight: 900 }}
                        >
                          {program.admission_plan ?? 0}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2.5,
                          backgroundColor: '#fff7ed',
                          border: '1px solid #fed7aa',
                        }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <EmojiEventsIcon fontSize="small" color="warning" />

                          <Typography variant="caption" color="text.secondary">
                            Цель
                          </Typography>

                          <Tooltip
                            title="Целевой средний балл рассчитывается по логике показателя Приоритет-2030: берутся абитуриенты в пределах плана набора по общему конкурсу, средний балл считается по их индивидуальным средним баллам. Для БВИ используется значение 100. Для обычных направлений учитываются ЕГЭ, для отдельных направлений с ДВИ учитываются допустимые вступительные испытания."
                            arrow
                          >
                            <InfoOutlinedIcon
                              sx={{
                                fontSize: 16,
                                color: 'text.secondary',
                                cursor: 'help',
                              }}
                            />
                          </Tooltip>
                        </Stack>

                        <Typography
                          variant="h6"
                          className="program-card-number"
                          sx={{ fontWeight: 900 }}
                        >
                          {program.target_avg_score ?? 0}
                        </Typography>
                      </Box>
                    </Box>

                    {program.monitoring && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.25,
                          borderRadius: 2.5,
                          backgroundColor: '#eff6ff',
                          border: '1px solid #dbeafe',
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={1.5}
                        >
                          {isAdmin && (
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Средний по плану
                                </Typography>

                                <Tooltip
                                  title="Сумма средних баллов ВПП в пределах плана, делённая на план набора. Если ВПП меньше плана, показатель снижается."
                                  arrow
                                >
                                  <InfoOutlinedIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      cursor: 'help',
                                    }}
                                  />
                                </Tooltip>
                              </Stack>

                              <Typography
                                variant="h6"
                                sx={{
                                  mt: 0.25,
                                  fontWeight: 900,
                                  color: '#1d4ed8',
                                }}
                              >
                                {averageScoreByPlan !== null &&
                                averageScoreByPlan !== undefined
                                  ? Number(averageScoreByPlan).toFixed(2)
                                  : '—'}
                              </Typography>
                            </Box>
                          )}

                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              textAlign: isAdmin ? 'right' : 'left',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.75}
                              alignItems="center"
                              justifyContent={
                                isAdmin ? 'flex-end' : 'flex-start'
                              }
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Средний балл по ВПП
                              </Typography>

                              <Tooltip
                                title="Фактический средний балл заявлений с ВПП в пределах плана набора."
                                arrow
                              >
                                <InfoOutlinedIcon
                                  sx={{
                                    fontSize: 16,
                                    color: 'text.secondary',
                                    cursor: 'help',
                                  }}
                                />
                              </Tooltip>
                            </Stack>

                            <Typography
                              variant="h6"
                              sx={{
                                mt: 0.25,
                                fontWeight: 900,
                                color: '#1d4ed8',
                              }}
                            >
                              {averageScoreByVppCount !== null &&
                              averageScoreByVppCount !== undefined
                                ? Number(averageScoreByVppCount).toFixed(2)
                                : '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}

                    {program.monitoring && admissionPlan > 0 && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.25,
                        borderRadius: 2.5,
                        backgroundColor: isClosed ? '#ecfdf3' : '#fffbeb',
                        border: '1px solid',
                        borderColor: isClosed ? '#bbf7d0' : '#fde68a',
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            mt: 0.15,
                            color: isClosed ? '#15803d' : '#b45309',
                            display: 'flex',
                          }}
                        >
                          {isClosed ? (
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
                                color: isClosed ? '#166534' : '#92400e',
                              }}
                            >
                              {isClosed
                                ? 'Общий конкурс закрыт ВПП'
                                : `Не хватает ВПП: ${planMissingCount}`}
                            </Typography>

                            <Tooltip
                              title="Проверка показывает, хватает ли заявлений с ВПП / высшим приоритетом для закрытия плана набора по общему конкурсу. Если ВПП меньше плана, недостающие места снижают средний балл по направлению."
                              arrow
                            >
                              <InfoOutlinedIcon
                                sx={{
                                  fontSize: 16,
                                  color: isClosed ? '#166534' : '#92400e',
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
                              color: isClosed ? '#166534' : '#92400e',
                            }}
                          >
                            ВПП в плане: {planApplicationsCount} из {admissionPlan}
                            {' '}
                            · заполнено {planFillPercent}%
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  </CardContent>

                  <CardActions
                    sx={{
                      p: 2,
                      pt: 0,
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                      },
                      gap: 1,
                    }}
                  >
                    <Button
                      startIcon={<CalculateIcon />}
                      onClick={() => goToCalculator(program)}
                      variant="contained"
                      fullWidth
                    >
                      Расчёт
                    </Button>

                    <Button
                      startIcon={<AutoAwesomeIcon />}
                      onClick={() => goToRecommendations(program)}
                      variant="outlined"
                      fullWidth
                    >
                      Рекомендации
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        </Box>
      ))}

      {filteredPrograms.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6">
            Направления не найдены
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Попробуйте изменить институт, поисковый запрос или фильтры направлений.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ProgramSelector;
