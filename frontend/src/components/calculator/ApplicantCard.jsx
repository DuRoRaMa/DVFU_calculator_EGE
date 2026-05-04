import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const ApplicantCard = ({
  applicant,
  isSelected,
  onAdd,
  showAddButton = true,
  borderColor = 'primary.main',
}) => {
  const avgScore = applicant.noExams ? 100 : Number(applicant.avg_score || 0);

  const getBorderColor = () => {
    if (borderColor) {
      return borderColor;
    }

    if (avgScore >= 90) {
      return 'success.main';
    }

    if (avgScore >= 75) {
      return 'primary.main';
    }

    return 'warning.main';
  };

  const getScoreColor = () => {
    if (avgScore >= 90) {
      return 'success.main';
    }

    if (avgScore >= 75) {
      return 'primary.main';
    }

    return 'error.main';
  };

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        mb: 1.5,
        borderLeft: '5px solid',
        borderColor: getBorderColor(),
        opacity: isSelected ? 0.55 : 1,
      }}
    >
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            fontWeight={700}
            sx={{
              fontSize: {
                xs: '0.95rem',
                sm: '1rem',
                md: '1.1rem',
              },
              wordBreak: 'break-word',
            }}
          >
            {applicant.name}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
          >
            Сумма баллов: {applicant.sumScore || '—'}
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
            {applicant.noExams && (
              <Chip size="small" label="БВИ" color="secondary" />
            )}

            {applicant.topPriority && (
              <Chip size="small" label="Высший приоритет" color="primary" />
            )}

            {applicant.approval && (
              <Chip size="small" label="Согласие" color="success" />
            )}
          </Box>
        </Box>

        <Box textAlign="right" sx={{ minWidth: 78 }}>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.85rem', md: '0.95rem' } }}
          >
            Средний
          </Typography>

          <Typography
            variant="h5"
            fontWeight={700}
            color={getScoreColor()}
            sx={{ fontSize: { xs: '1.2rem', md: '1.45rem' } }}
          >
            {avgScore.toFixed(2)}
          </Typography>

          {showAddButton && (
            <IconButton
              onClick={() => onAdd(applicant)}
              disabled={isSelected}
              size="large"
              sx={{
                opacity: isSelected ? 0.5 : 1,
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              <AddCircleIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ApplicantCard;
