// src/components/calculator/ApplicantsTable.jsx
import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import ApplicantCard from './ApplicantCard';

const ApplicantsTable = ({
  applicants,
  selectedIds,
  onAdd,
  admissionPlan,
  sortField,
  sortDirection,
  onSortChange
}) => {
  return (
    <Paper elevation={3} sx={{ height: '100%' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
        <Typography variant="h6">
          Общий список абитуриентов
        </Typography>
        <Typography variant="caption">
          Всего: {applicants.length} человек
        </Typography>
      </Box>
      
      <Box sx={{ maxHeight: 500, overflow: 'auto', p: 1 }}>
        {applicants.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Нет абитуриентов по выбранным фильтрам
            </Typography>
          </Box>
        ) : (
          applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              isSelected={selectedIds.includes(applicant.id)}
              onAdd={onAdd}
              showAddButton={selectedIds.length < admissionPlan}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

export default ApplicantsTable;