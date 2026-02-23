import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ScenarioPage = ({ program }) => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Симулятор "Что если"
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mt: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          {program.name}
        </Typography>
        <Typography variant="body1" paragraph>
          Этот модуль позволяет тестировать различные сценарии изменения состава абитуриентов.
        </Typography>
        
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Функции симулятора:
          </Typography>
          <Box textAlign="left" sx={{ maxWidth: 600, mx: 'auto' }}>
            <ul>
              <li>Добавление/удаление абитуриентов</li>
              <li>Мгновенный пересчет среднего балла</li>
              <li>Визуализация изменений (дельта)</li>
              <li>Сравнение нескольких сценариев</li>
            </ul>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          size="large"
          sx={{ mt: 3 }}
          onClick={() => navigate(`/calculate/${program.id}`)}
        >
          Вернуться к основному расчету
        </Button>
      </Paper>
    </Box>
  );
};

export default ScenarioPage;