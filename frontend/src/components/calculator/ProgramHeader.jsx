// src/components/calculator/ProgramHeader.jsx
import React from 'react';
import { Paper, Typography, Chip, Divider, Grid, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ProgramHeader = ({ program, selectedCount, onBack }) => {
  const availablePlaces = program.admission_plan - selectedCount;
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Расчет среднего балла ЕГЭ
      </Typography>
      
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h5" color="primary" sx={{ mr: 2 }}>
          {program.name}
        </Typography>
        <Chip label={program.code} size="small" />
        <Chip 
          label={program.study_form} 
          size="small" 
          variant="outlined" 
          sx={{ ml: 1 }}
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              План приёма
            </Typography>
            <Typography variant="h5">
              {program.admission_plan} мест
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Целевой балл
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {program.target_avg_score}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Выбрано
            </Typography>
            <Typography variant="h5" color={
              selectedCount > program.admission_plan ? 'error' : 'primary'
            }>
              {selectedCount}/{program.admission_plan}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Доступно мест
            </Typography>
            <Typography variant="h5">
              {availablePlaces > 0 ? availablePlaces : 0}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProgramHeader;