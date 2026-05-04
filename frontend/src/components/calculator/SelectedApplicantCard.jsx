import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const SelectedApplicantCard = ({ applicant, onRemove }) => {
  const avgScore = applicant.noExams ? 100 : Number(applicant.avg_score || 0);

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        mb: 1.5,
        borderLeft: '5px solid',
        borderColor: 'success.main',
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
            Сумма баллов: {applicant.sumScore || '—'} • Средний: {avgScore.toFixed(2)}
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

        <IconButton
          onClick={() => onRemove(applicant.id)}
          size="large"
          sx={{
            alignSelf: 'center',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
            },
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default SelectedApplicantCard;
