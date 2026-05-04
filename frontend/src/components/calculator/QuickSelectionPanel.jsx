import React from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

const QuickSelectionPanel = ({
  onSelect,
  selectedCount,
  admissionPlan,
}) => {
  const isLimitReached = selectedCount >= admissionPlan;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 3,
        borderRadius: 3,
      }}
      variant="outlined"
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ fontSize: { xs: '1.15rem', md: '1.35rem' } }}
          >
            Быстрый выбор
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}
          >
            Выбирает абитуриентов из текущего отфильтрованного списка с учетом плана приема.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems="stretch"
        >
          <Button
            startIcon={<TrendingUpIcon />}
            onClick={() => onSelect('top')}
            disabled={isLimitReached}
            variant="contained"
            size="large"
          >
            Топ по среднему баллу
          </Button>

          <Button
            startIcon={<SchoolIcon />}
            onClick={() => onSelect('bvi')}
            disabled={isLimitReached}
            variant="outlined"
            size="large"
          >
            Только БВИ
          </Button>

          <Button
            startIcon={<PriorityHighIcon />}
            onClick={() => onSelect('highPriority')}
            disabled={isLimitReached}
            variant="outlined"
            size="large"
          >
            Высший приоритет
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default QuickSelectionPanel;
