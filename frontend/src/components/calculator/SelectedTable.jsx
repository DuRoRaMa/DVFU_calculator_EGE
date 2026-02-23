// src/components/calculator/SelectedTable.jsx
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Alert
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
  admissionPlan
}) => {
  const availablePlaces = admissionPlan - selectedApplicants.length;
  
  return (
    <Paper elevation={3} sx={{ height: '100%' }}>
      <Box sx={{ p: 2, bgcolor: 'secondary.light', color: 'white' }}>
        <Typography variant="h6">
          Выбранные для расчета
        </Typography>
        <Typography variant="caption">
          Включено в расчет: {selectedApplicants.length} человек
        </Typography>
      </Box>
      
      {selectedApplicants.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Выберите абитуриентов из списка слева
          </Typography>
        </Box>
      ) : (
        <>
          {availablePlaces < 0 && (
            <Alert severity="error" sx={{ m: 2 }}>
              Превышен лимит на {Math.abs(availablePlaces)} мест!
            </Alert>
          )}
          
          <Box sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
            {selectedApplicants.map((applicant) => (
              <SelectedApplicantCard
                key={applicant.id}
                applicant={applicant}
                onRemove={onRemove}
              />
            ))}
          </Box>
          
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onClear}
              fullWidth
              sx={{ mb: 1 }}
            >
              Очистить всю выборку
            </Button>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={onCalculate}
              disabled={selectedApplicants.length === 0 || loading}
              startIcon={<CheckCircleIcon />}
            >
              {loading ? 'Расчет...' : 'Рассчитать средний балл'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SelectedTable;