// src/components/calculator/SelectedApplicantCard.jsx
import React from 'react';
import { Paper, Typography, Chip, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const SelectedApplicantCard = ({ 
  applicant, 
  onRemove 
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: applicant.noExams ? 'success.light' : 'action.selected',
        borderLeft: 4,
        borderColor: applicant.noExams ? 'success.main' : 'primary.main',
        '&:hover': {
          backgroundColor: 'action.hover',
        }
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" fontWeight="medium" gutterBottom>
          {applicant.name}
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="caption" color="text.secondary">
            Сумма ЕГЭ: {applicant.sumScore || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Средний: {applicant.noExams ? '100.00' : applicant.avg_score.toFixed(2)}
          </Typography>
          {applicant.noExams && (
            <Typography 
              variant="caption" 
              color="success.main"
              fontWeight="bold"
            >
              (БВИ)
            </Typography>
          )}
        </Box>
        
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {applicant.noExams && (
            <Chip 
              label="БВИ" 
              size="small" 
              color="success"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          {applicant.topPriority && (
            <Chip 
              label="Высший приоритет" 
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          {applicant.hightPriorityNoOriginal && (
            <Chip 
              label="Без оригиналов" 
              size="small" 
              color="warning"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </Box>
      
      <Box display="flex" alignItems="center" gap={1} sx={{ ml: 2 }}>

        <IconButton
          color="error"
          size="small"
          onClick={() => onRemove(applicant.id)}
          sx={{
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default SelectedApplicantCard;