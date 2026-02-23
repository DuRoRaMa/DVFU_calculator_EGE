// src/components/calculator/FiltersPanel.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  FormControlLabel,
  Checkbox,
  TextField,
  Button
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';

const FiltersPanel = ({
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  totalApplicants,
  filteredCount
}) => {
  const handleFilterToggle = (filterName) => {
    onFilterChange({
      ...filters,
      [filterName]: !filters[filterName]
    });
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" display="flex" alignItems="center">
          <FilterListIcon sx={{ mr: 1 }} fontSize="small" />
          Фильтры
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Показано: {filteredCount} из {totalApplicants}
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.bvi}
                onChange={() => handleFilterToggle('bvi')}
                size="small"
              />
            }
            label="Только БВИ"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.highPriority}
                onChange={() => handleFilterToggle('highPriority')}
                size="small"
              />
            }
            label="Высший приоритет"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption">Балл от:</Typography>
            <TextField
              size="small"
              type="number"
              value={filters.minScore}
              onChange={(e) => onFilterChange({...filters, minScore: Number(e.target.value)})}
              sx={{ width: 70 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption">до:</Typography>
            <TextField
              size="small"
              type="number"
              value={filters.maxScore}
              onChange={(e) => onFilterChange({...filters, maxScore: Number(e.target.value)})}
              sx={{ width: 70 }}
            />
          </Box>
        </Grid>
      </Grid>
      
      <Box display="flex" gap={1} mt={2}>
        <Button
          size="small"
          startIcon={<SortIcon />}
          variant={sortField === 'avg_score' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('avg_score')}
        >
          По баллу {sortField === 'avg_score' && (sortDirection === 'desc' ? '↓' : '↑')}
        </Button>
        <Button
          size="small"
          variant={sortField === 'name' ? 'contained' : 'outlined'}
          onClick={() => onSortChange('name')}
        >
          По имени {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
        </Button>
      </Box>
    </Paper>
  );
};

export default FiltersPanel;