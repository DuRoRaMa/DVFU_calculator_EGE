import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ProgramSelector = ({ programs, selectedProgram, onSelectProgram }) => {
  const navigate = useNavigate();
  const [school, setSchool] = useState('');

  const schools = useMemo(() => {
    return [...new Set(programs.map((program) => program.school_name))]
      .filter(Boolean)
      .sort();
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      return school === '' || program.school_name === school;
    });
  }, [programs, school]);

  const groupedPrograms = useMemo(() => {
    return filteredPrograms.reduce((acc, program) => {
      const schoolName = program.school_name || 'Без школы';

      if (!acc[schoolName]) {
        acc[schoolName] = [];
      }

      acc[schoolName].push(program);
      return acc;
    }, {});
  }, [filteredPrograms]);

  const handleSelect = (program) => {
    onSelectProgram(program);
  };

  const handleGoToCalculate = () => {
    if (selectedProgram) {
      navigate(`/calculate/${selectedProgram.id}`);
    }
  };

  const chipSx = {
    maxWidth: '100%',
    height: 'auto',
    minHeight: 28,
    py: 0.4,
    fontSize: '0.85rem',
    '& .MuiChip-label': {
      display: 'block',
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'unset',
      lineHeight: 1.25,
    },
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: '1.65rem', md: '2.25rem' } }}
        >
          Выберите направление подготовки
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}
        >
          Для расчета среднего балла ЕГЭ выберите направление из списка.
        </Typography>
      </Box>

      <TextField
        select
        label="Выберите школу"
        value={school}
        onChange={(event) => setSchool(event.target.value)}
        sx={{ mb: 4, width: { xs: '100%', sm: 340 } }}
        size="medium"
      >
        <MenuItem value="">Все школы</MenuItem>

        {schools.map((schoolName) => (
          <MenuItem key={schoolName} value={schoolName}>
            {schoolName}
          </MenuItem>
        ))}
      </TextField>

      {Object.entries(groupedPrograms).map(([schoolName, schoolPrograms]) => (
        <Box key={schoolName} sx={{ mb: 5, width: '100%' }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              mb: 2,
              fontSize: { xs: '1.35rem', md: '1.65rem' },
            }}
          >
            {schoolName}
          </Typography>

          <Box
            sx={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 3,
              alignItems: 'stretch',
            }}
          >
            {schoolPrograms.map((program) => {
              const isSelected = selectedProgram?.id === program.id;
              const monitoring = program.monitoring;

              return (
                <Card
                  key={program.id}
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    height: '100%',
                    minHeight: 410,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: isSelected ? '2px solid' : '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    boxShadow: isSelected ? 6 : 2,
                    transition: '0.2s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={1}
                        sx={{ minWidth: 0 }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            fontSize: { xs: '1.15rem', md: '1.25rem' },
                            lineHeight: 1.25,
                            minWidth: 0,
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                        >
                          {program.name}
                        </Typography>

                        {isSelected && (
                          <CheckCircleIcon color="primary" sx={{ flexShrink: 0 }} />
                        )}
                      </Box>

                      <Chip
                        label={`Шифр: ${program.code}`}
                        size="small"
                        sx={{
                          ...chipSx,
                          alignSelf: 'flex-start',
                          flexShrink: 0,
                        }}
                      />

                      <Divider />

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 1.5,
                          minWidth: 0,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                            Форма обучения
                          </Typography>
                          <Typography
                            fontWeight={600}
                            sx={{
                              fontSize: '1.05rem',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {program.study_form}
                          </Typography>
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                            План приёма
                          </Typography>
                          <Typography fontWeight={600} sx={{ fontSize: '1.05rem' }}>
                            {program.admission_plan} мест
                          </Typography>
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                            Целевой балл
                          </Typography>
                          <Typography fontWeight={600} sx={{ fontSize: '1.05rem' }}>
                            {program.target_avg_score}
                          </Typography>
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                            Статус
                          </Typography>
                          <Typography
                            fontWeight={600}
                            sx={{
                              fontSize: '1.05rem',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {program.status}
                          </Typography>
                        </Box>
                      </Box>

                      {monitoring && (
                        <>
                          <Divider />

                          <Box sx={{ mt: 'auto', minWidth: 0 }}>
                            <Typography
                              color="text.secondary"
                              sx={{
                                mb: 1,
                                fontSize: '0.95rem',
                              }}
                            >
                              Мониторинг
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip
                                color="primary"
                                size="small"
                                label={`Средний по плану: ${monitoring.avg_score}`}
                                sx={chipSx}
                              />

                              <Chip
                                size="small"
                                label={`Абитуриентов: ${monitoring.applicants_count}`}
                                sx={chipSx}
                              />

                              <Chip
                                color="success"
                                size="small"
                                label={`Согласий: ${monitoring.approval_count}`}
                                sx={chipSx}
                              />

                              <Chip
                                color="secondary"
                                size="small"
                                label={`Высший приоритет: ${monitoring.top_priority_count}`}
                                sx={chipSx}
                              />
                            </Stack>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      onClick={() => handleSelect(program)}
                      variant={isSelected ? 'contained' : 'outlined'}
                      size="large"
                      sx={{ fontSize: '1rem' }}
                    >
                      {isSelected ? 'Выбрано' : 'Выбрать'}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        </Box>
      ))}

      {selectedProgram && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 24,
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
            zIndex: 10,
          }}
        >
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleGoToCalculate}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 999,
              boxShadow: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Перейти к расчету
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProgramSelector;
