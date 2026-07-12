import React, { useState } from 'react';

import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import PriorityDirectionsStats from './PriorityDirectionsStats';
import NewModelDirectionsStats from './NewModelDirectionsStats';

const SpecialDirectionsStats = () => {
  const [mode, setMode] = useState('priority');

  const handleChange = (_, newMode) => {
    if (newMode) {
      setMode(newMode);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="priority">
          Приоритет 2030
        </ToggleButton>

        <ToggleButton value="new_model">
          Новая модель
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === 'priority' ? (
        <PriorityDirectionsStats />
      ) : (
        <NewModelDirectionsStats />
      )}
    </Box>
  );
};

export default SpecialDirectionsStats;