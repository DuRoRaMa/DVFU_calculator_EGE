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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalculateIcon from '@mui/icons-material/Calculate';

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

const cardGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    sm: 'repeat(auto-fill, 400px)',
  },
  gap: 3,
  alignItems: 'stretch',
};

const cardSx = {
  width: {
    xs: '100%',
    sm: 400,
  },
  minWidth: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 3,
  boxShadow: 2,
  border: '1px solid transparent',
};

const ProgramSelector = ({ programs, onSelectProgram }) => {
  const navigate = useNavigate();
  const [school, setSchool] = useState('');

  const goToCalculator = (program) => {
    onSelectProgram(program);
    navigate(`/calculate/${program.id}`);
  };

  const goToRecommendations = (program) => {
    onSelectProgram(program);
    navigate(`/recommendations/${program.id}`);
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => school === '' || program.school_name === school);
  }, [programs, school]);

  const groupedPrograms = useMemo(() => {
    return filteredPrograms.reduce((acc, program) => {
      const schoolName = program.school_name || 'Без школы';
      if (!acc[schoolName]) acc[schoolName] = [];
      acc[schoolName].push(program);
      return acc;
    }, {});
  }, [filteredPrograms]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Выберите направление подготовки
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Для каждого направления доступны конструктор среднего балла и система рекомендаций.
        </Typography>
      </Box>

      <TextField
        select
        fullWidth
        label="Выберите школу"
        value={school}
        onChange={(event) => setSchool(event.target.value)}
        sx={{ mb: 3, maxWidth: 420 }}
      >
        <MenuItem value="">Все школы</MenuItem>
        {SCHOOL_OPTIONS.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>

      {Object.entries(groupedPrograms).map(([schoolName, schoolPrograms]) => (
        <Box key={schoolName} sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            {schoolName}
          </Typography>

          <Box sx={cardGridSx}>
            {schoolPrograms.map((program) => (
              <Card key={program.id} sx={cardSx}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    fontWeight="bold"
                    sx={{
                      overflowWrap: 'anywhere',
                      wordBreak: 'normal',
                      hyphens: 'auto',
                      lineHeight: 1.25,
                    }}
                  >
                    {program.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, mb: 2 }}>
                    Шифр: {program.code || '—'}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 'auto' }}>
                    <Chip label={`Форма: ${program.study_form || '—'}`} size="small" />
                    <Chip
                      label={`План: ${program.admission_plan ?? '—'} мест`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`Цель: ${program.target_avg_score ?? '—'}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1.25 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<CalculateIcon />}
                    onClick={() => goToCalculator(program)}
                    sx={{ whiteSpace: 'nowrap', minWidth: 0 }}
                  >
                    Расчёт
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => goToRecommendations(program)}
                    sx={{ whiteSpace: 'nowrap', minWidth: 0 }}
                  >
                    Рекомендации
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ProgramSelector;
