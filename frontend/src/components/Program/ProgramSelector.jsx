import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
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

const ProgramSelector = ({ programs, onSelectProgram }) => {
  const navigate = useNavigate();
  const [school, setSchool] = useState('');

  const goToCalculator = (program) => {
    if (program) {
      onSelectProgram(program);
      navigate(`/calculate/${program.id}`);
    }
  };

  const goToRecommendations = (program) => {
    if (program) {
      onSelectProgram(program);
      navigate(`/recommendations/${program.id}`);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    return school === '' || program.school_name === school;
  });

  const groupedPrograms = filteredPrograms.reduce((acc, program) => {
    const schoolName = program.school_name || 'Без школы';
    if (!acc[schoolName]) acc[schoolName] = [];
    acc[schoolName].push(program);
    return acc;
  }, {});

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

          <Grid container spacing={3} alignItems="stretch">
            {schoolPrograms.map((program) => (
              <Grid item xs={12} md={6} lg={4} key={program.id} sx={{ display: 'flex' }}>
                <Card
                  sx={{
                    width: '100%',
                    height: 280,
                    minHeight: 280,
                    maxHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: 2,
                    border: '1px solid transparent',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      fontWeight="bold"
                      sx={{
                        minHeight: 64,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {program.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      Шифр: {program.code}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={`Форма: ${program.study_form || '-'}`} size="small" />
                      <Chip label={`План: ${program.admission_plan} мест`} size="small" color="primary" variant="outlined" />
                      <Chip label={`Цель: ${program.target_avg_score}`} size="small" color="secondary" variant="outlined" />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1, alignItems: 'stretch' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<CalculateIcon />}
                      onClick={() => goToCalculator(program)}
                    >
                      Расчёт
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={() => goToRecommendations(program)}
                    >
                      Рекомендации
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default ProgramSelector;
