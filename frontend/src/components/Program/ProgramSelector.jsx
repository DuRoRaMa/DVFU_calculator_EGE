import React,{ useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ← Добавить
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Box,
  Divider,
  CardActions
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ProgramSelector = ({ programs, selectedProgram, onSelectProgram }) => {
  const navigate = useNavigate(); // ← Добавить хук

  const handleSelect = (program) => {
    onSelectProgram(program);
  };

  const handleGoToCalculate = () => {
    if (selectedProgram) {
      navigate(`/calculate/${selectedProgram.id}`);
    }
  };

  
  const [school, setSchool] = useState("");
  
  const handleChangeSchool = (e) => {
    setSchool(e.target.value);
  };

  const filteredPrograms = programs.filter(program => {
    return (
      (school === "" || program.school_name === school)
    );
  });

  const groupedPrograms = filteredPrograms.reduce((acc, program) => {
    if (!acc[program.school_name]) acc[program.school_name] = [];
    acc[program.school_name].push(program);
    return acc;
  }, {});

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Выберите направление подготовки
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Для расчета среднего балла ЕГЭ выберите направление из списка
      </Typography>

      <label>
        Выберите школу:
        <select value={school} onChange={handleChangeSchool}>
          <option value="">----</option>
          <option value="ИМКТ">ИМКТ</option>
          <option value="ШЭМ">ШЭМ</option>
          <option value="ШМиНЖ">ШМиНЖ</option>
          <option value="ИТПМ">ИТПМ</option>
          <option value="ИФКС">ИФКС</option>
          <option value="ЮШ">ЮШ</option>
          <option value="ШИГН">ШИГН</option>
          <option value="ПИШ">ПИШ</option>
          <option value="ШП">ШП</option>
          <option value="ВИ">ВИ</option>
          <option value="ИМО">ИМО</option>
          <option value="ПИ">ПИ</option>
        </select>
      </label>
      
      {Object.entries(groupedPrograms).map(([schoolName, programs]) => (
        <Box key={schoolName} sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {schoolName}
          </Typography>
          <Divider sx={{ my: 1, borderBottomWidth: 2 }} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {programs.map((program) => (
          <Grid item xs={12} md={12} lg={12} key={program.id}>
            <Card 
              variant="outlined"
              sx={{
                height: '100%',
                borderColor: selectedProgram?.id === program.id ? 'primary.main' : 'divider',
                borderWidth: selectedProgram?.id === program.id ? 2 : 1,
                transition: 'all 0.2s',
                width: 450

              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" component="div">
                      {program.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Шифр: {program.code}
                    </Typography>
                  </Box>
                  {selectedProgram?.id === program.id && (
                    <CheckCircleIcon color="primary" />
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={1}>
                  <Grid item xs={6}
                  sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',  // Горизонтально
                            justifyContent: 'center'  // Вертикально
                        }}>
                    <Typography variant="caption" color="text.secondary">
                      Форма обучения
                    </Typography>
                    <Typography variant="body2">
                      {program.study_form}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}
                  sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',  // Горизонтально
                            justifyContent: 'center'  // Вертикально
                        }}>
                    <Typography variant="caption" color="text.secondary">
                      План приёма
                    </Typography>
                    <Typography variant="body2">
                      {program.admission_plan} мест
                    </Typography>
                  </Grid>
                  <Grid item xs={6}
                    sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',  // Горизонтально
                            justifyContent: 'center'  // Вертикально
                        }}>
                    <Typography variant="caption" color="text.secondary">
                      Целевой балл
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {program.target_avg_score}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}
                    sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',  // Горизонтально
                            justifyContent: 'center'  // Вертикально
                        }}>
                    <Grid item>
                        <Typography variant="caption" color="text.secondary">
                            Статус
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Chip 
                            label={program.status}
                            size="small"
                            color={program.status === 'Активно' ? 'success' : 'default'}
                        />
                    </Grid>
                    
                  </Grid>
                </Grid>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => handleSelect(program)}
                  variant={selectedProgram?.id === program.id ? "contained" : "outlined"}
                >
                  {selectedProgram?.id === program.id ? 'Выбрано' : 'Выбрать'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      </Box>
      ))}
      
      {selectedProgram && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGoToCalculate}
            endIcon={<ArrowForwardIcon />}
          >
            Перейти к расчету
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProgramSelector;