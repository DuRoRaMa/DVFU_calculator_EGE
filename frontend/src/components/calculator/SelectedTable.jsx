import React from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import SelectedApplicantCard from './SelectedApplicantCard';

const SelectedTable = ({
  selectedApplicants,
  onRemove,
  onClear,
  onCalculate,
  loading,
  admissionPlan,
}) => {
  const availablePlaces = admissionPlan - selectedApplicants.length;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        height: '100%',
        minHeight: 520,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={1}
        mb={2}
        sx={{ minWidth: 0 }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            fontSize: { xs: '1.2rem', md: '1.45rem' },
            overflowWrap: 'anywhere',
          }}
        >
          Выборка для расчета
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            flexShrink: 0,
          }}
        >
          {selectedApplicants.length}/{admissionPlan} человек
        </Typography>
      </Box>

      {availablePlaces < 0 && (
        <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
          Превышен лимит на {Math.abs(availablePlaces)} мест.
        </Alert>
      )}

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: '100%',
          overflowY: 'auto',
          pr: { xs: 0, md: 1 },
          maxHeight: { xs: 'none', lg: '70vh' },
        }}
      >
        {selectedApplicants.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Выберите абитуриентов из списка слева
          </Box>
        ) : (
          selectedApplicants.map((applicant) => (
            <SelectedApplicantCard
              key={applicant.id}
              applicant={applicant}
              onRemove={onRemove}
            />
          ))
        )}
      </Box>

      {selectedApplicants.length > 0 && (
        <Box sx={{ mt: 2, width: '100%' }}>
          <Button
            startIcon={<DeleteIcon />}
            onClick={onClear}
            fullWidth
            variant="outlined"
            color="error"
            size="large"
            sx={{ mb: 1, fontSize: { xs: '0.95rem', md: '1.05rem' } }}
          >
            Очистить всю выборку
          </Button>

          <Button
            startIcon={<CheckCircleIcon />}
            onClick={onCalculate}
            fullWidth
            variant="contained"
            disabled={loading}
            size="large"
            sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}
          >
            {loading ? 'Расчет...' : 'Рассчитать средний балл выборки'}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default SelectedTable;
