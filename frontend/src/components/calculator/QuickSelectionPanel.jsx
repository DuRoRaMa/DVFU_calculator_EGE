// src/components/calculator/QuickSelectionPanel.jsx
import React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

const QuickSelectionPanel = ({ onSelect, selectedCount, admissionPlan }) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Быстрый выбор:
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          startIcon={<TrendingUpIcon />}
          onClick={() => onSelect('top')}
          disabled={selectedCount >= admissionPlan}
        >
          Топ по баллам
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SchoolIcon />}
          onClick={() => onSelect('bvi')}
          disabled={selectedCount >= admissionPlan}
        >
          Только БВИ
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PriorityHighIcon />}
          onClick={() => onSelect('highPriority')}
          disabled={selectedCount >= admissionPlan}
        >
          Высший приоритет
        </Button>
      </Stack>
    </Box>
  );
};

export default QuickSelectionPanel;