// src/components/calculator/ApplicantCard.jsx
import React from 'react';
import { Paper, Typography, Chip, Box, IconButton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const ApplicantCard = ({ 
  applicant, 
  isSelected, 
  onAdd, 
  showAddButton = true,
  borderColor = 'primary.main'
}) => {
  const avgScore = applicant.noExams ? 100 : applicant.avg_score;
  
  // Определяем цвет границы на основе балла
  const getBorderColor = () => {
    if (borderColor) return borderColor;
    if (avgScore >= 90) return 'success.main';
    if (avgScore >= 75) return 'primary.main';
    return 'warning.main';
  };

  // Определяем цвет текста балла
  const getScoreColor = () => {
    if (avgScore >= 90) return 'success.main';
    if (avgScore >= 75) return 'primary.main';
    return 'error.main';
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: 4,
        borderColor: getBorderColor(),
        opacity: isSelected ? 0.6 : 1,
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
          <Typography 
            variant="caption" 
            color="text.secondary" 
            fontWeight="bold"
            sx={{ 
              backgroundColor: 'action.selected',
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}
          >
            Сумма: {applicant.sumScore || '—'}
          </Typography>
          

        </Box>
        
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {applicant.noExams && (
            <Chip 
              label="БВИ" 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          )}
          {applicant.topPriority && (
            <Chip 
              label="Высший приоритет" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          )}
          {applicant.hightPriorityNoOriginal && (
            <Chip 
              label="Без оригиналов" 
              size="small" 
              color="warning" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          )}
        </Box>
      </Box>
      
      <Box display="flex" alignItems="center" gap={2} sx={{ ml: 2 }}>
        <Box textAlign="right">
          <Typography variant="body2" color="text.secondary">
            Средний:
          </Typography>
          <Typography 
            variant="h6" 
            color={getScoreColor()}
            sx={{ 
              fontWeight: 'bold',
              position: 'relative'
            }}
          >
            {applicant.noExams ? '100.00' : applicant.avg_score.toFixed(2)}
            {applicant.noExams && (
              <Typography 
                component="span" 
                variant="caption" 
                color="success.main"
                sx={{ 
                  position: 'absolute',
                  top: -8,
                  right: 0,
                  fontWeight: 'bold'
                }}
              >
                (БВИ)
              </Typography>
            )}
          </Typography>
        </Box>
        
        {showAddButton && (
          <IconButton
            color="primary"
            size="small"
            onClick={() => onAdd(applicant)}
            disabled={isSelected}
            sx={{
              opacity: isSelected ? 0.5 : 1,
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <AddCircleIcon />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default ApplicantCard;