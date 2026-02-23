// src/components/calculator/ResultsPanel.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Divider,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getApplicantAverageScore } from './utils/calculatorLogic';

const ResultsPanel = ({ results, program, selectedApplicants }) => {
  if (!results) return null;

  return (
    <Paper 
      elevation={4} 
      sx={{ 
        mt: 4, 
        p: 3, 
        bgcolor: results.is_above_target ? 'success.light' : 'warning.light'
      }}
    >
      <Typography variant="h5" gutterBottom>
        Результаты расчета
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Средний балл выборки
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {results.calculated_avg_score.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Целевой балл
            </Typography>
            <Typography variant="h3">
              {program.target_avg_score}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Отклонение
            </Typography>
            <Typography 
              variant="h3" 
              color={results.deviation_from_target >= 0 ? 'success.main' : 'error.main'}
            >
              {results.deviation_from_target >= 0 ? '+' : ''}
              {results.deviation_from_target.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Статус
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center">
              {results.is_above_target ? (
                <>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="success.main">
                    Выше цели
                  </Typography>
                </>
              ) : (
                <>
                  <CancelIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="error.main">
                    Ниже цели
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Статистика выборки
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              БВИ
            </Typography>
            <Typography variant="h6" color="success.main">
              {results.bvi_count} чел.
            </Typography>
            <Typography variant="caption">
              ({results.bvi_percentage.toFixed(1)}%)
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Высший приоритет
            </Typography>
            <Typography variant="h6" color="primary.main">
              {results.high_priority_count} чел.
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Без оригиналов
            </Typography>
            <Typography variant="h6" color="warning.main">
              {results.no_original_count} чел.
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6} sm={4} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Средняя сумма ЕГЭ
            </Typography>
            <Typography variant="h6">
              {results.avg_sum_score.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={8} md={3}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Распределение приоритетов
            </Typography>
            <Typography variant="body2">
              1-й: {selectedApplicants.filter(a => a.priority === 1).length} чел. • 
              2-й: {selectedApplicants.filter(a => a.priority === 2).length} чел. • 
              3-й: {selectedApplicants.filter(a => a.priority === 3).length} чел.
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      {results.has_bvi && (
        <Alert severity="info" sx={{ mt: 2 }}>
          В расчете учтены {results.bvi_count} абитуриентов с БВИ (средний балл = 100)
          {results.bvi_count < selectedApplicants.length && (
            <> • Средний без БВИ: {results.avg_without_bvi.toFixed(2)}</>
          )}
        </Alert>
      )}
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Интерпретация:</strong> Средний балл по выбранным {results.selected_count} абитуриентам 
          составляет <strong>{results.calculated_avg_score.toFixed(2)}</strong> баллов, что 
          {results.is_above_target ? ' превышает' : ' ниже'} целевого значения на{' '}
          <strong>{Math.abs(results.deviation_from_target).toFixed(2)}</strong> баллов.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ResultsPanel;