import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';

import ApplicantCard from './ApplicantCard';

const ApplicantsTable = ({
  applicants,
  selectedIds,
  onAdd,
}) => {
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
          Общий список абитуриентов
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            flexShrink: 0,
          }}
        >
          Всего: {applicants.length} человек
        </Typography>
      </Box>

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
        {applicants.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Нет абитуриентов по выбранным фильтрам
          </Box>
        ) : (
          applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              isSelected={selectedIds.includes(applicant.id)}
              onAdd={onAdd}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

export default ApplicantsTable;
