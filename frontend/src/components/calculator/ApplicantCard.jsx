import React from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const getScoreTone = (score) => {
  if (score >= 90) {
    return {
      bg: '#ecfdf3',
      color: '#067647',
      border: '#bbf7d0',
    };
  }

  if (score >= 75) {
    return {
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
    };
  }

  return {
    bg: '#fff7ed',
    color: '#c2410c',
    border: '#fed7aa',
  };
};

const ApplicantCard = ({
  applicant,
  isSelected,
  onAdd,
  showAddButton = true,
}) => {
  const avgScore = applicant.noExams ? 100 : Number(applicant.avg_score || 0);
  const scoreTone = getScoreTone(avgScore);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 1.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: isSelected ? '#bbf7d0' : '#e5e7eb',
        backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
        transition: '0.18s ease',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
          borderColor: isSelected ? '#86efac' : '#cbd5e1',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {applicant.name || 'Без имени'}
          </Typography>

          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 1 }}
          >
            <Chip
              size="small"
              label={`Сумма: ${applicant.sumScore || '—'}`}
              sx={{ fontWeight: 700 }}
            />

            {applicant.noExams && (
              <Chip
                size="small"
                icon={<WorkspacePremiumIcon />}
                label="БВИ"
                color="success"
                variant="outlined"
              />
            )}

            {applicant.topPriority && (
              <Chip
                size="small"
                icon={<PriorityHighIcon />}
                label="Высший приоритет"
                color="primary"
                variant="outlined"
              />
            )}

            {applicant.approval ? (
              <Chip
                size="small"
                icon={<VerifiedIcon />}
                label="Согласие"
                color="success"
              />
            ) : (
              <Chip
                size="small"
                label="Без согласия"
                variant="outlined"
              />
            )}

            {applicant.hightPriorityNoOriginal && (
              <Chip
                size="small"
                label="ВПР без оригинала"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          {applicant.statusVuz && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.8 }}
            >
              Статус: {applicant.statusVuz}
            </Typography>
          )}
        </Box>

        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            flex: { xs: 'unset', sm: '0 0 120px' },
          }}
        >
          <Box
            sx={{
              minWidth: 96,
              px: 1.5,
              py: 1,
              borderRadius: 2.5,
              textAlign: 'center',
              backgroundColor: scoreTone.bg,
              color: scoreTone.color,
              border: '1px solid',
              borderColor: scoreTone.border,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Средний
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {avgScore.toFixed(2)}
            </Typography>
          </Box>

          {showAddButton && (
            <Button
              startIcon={isSelected ? <AssignmentTurnedInIcon /> : <AddCircleIcon />}
              onClick={() => onAdd(applicant)}
              disabled={isSelected}
              variant={isSelected ? 'outlined' : 'contained'}
              size="small"
              fullWidth
              sx={{
                minWidth: { xs: 120, sm: '100%' },
                whiteSpace: 'nowrap',
              }}
            >
              {isSelected ? 'Выбран' : 'Добавить'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ApplicantCard;
