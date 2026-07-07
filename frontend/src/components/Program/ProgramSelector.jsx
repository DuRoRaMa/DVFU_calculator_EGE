import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Tooltip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalculateIcon from '@mui/icons-material/Calculate';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

const ProgramSelector = ({
  programs,
  onSelectProgram,
}) => {
  const navigate = useNavigate();
  const [school, setSchool] = useState('');
  const [search, setSearch] = useState('');

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

      const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesSchool && matchesSearch;
    });
  }, [programs, school, search]);

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
            md: '320px minmax(0, 1fr)',
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
              const monitoringAvgScore = getMonitoringValue(program, 'average_score', 'avg_score');
              const monitoringApplicants = getMonitoringValue(program, 'total_applications', 'applicants_count');
              const monitoringApprovals = getMonitoringValue(program, 'approvals_count', 'approval_count');

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
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ mb: 1.5 }}
                    >
                      <Chip
                        label={program.code || '—'}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />

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
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Мониторинг по ВПП
                          </Typography>

                          <Tooltip
                            title="Средний балл в этом блоке считается только по заявлениям с ВПП / высшим приоритетом. Общее количество заявлений и согласий показывается справочно."
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

                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Средний ВПП: {monitoringAvgScore ?? '—'} · Заявлений: {monitoringApplicants ?? '—'} · Согласий: {monitoringApprovals ?? '—'}
                        </Typography>
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
            Попробуйте изменить институт или поисковый запрос.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ProgramSelector;
