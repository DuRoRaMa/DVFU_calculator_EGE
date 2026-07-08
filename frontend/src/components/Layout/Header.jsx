import React from 'react';
import { AppBar, Box, Button, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = Boolean(currentUser?.is_staff || currentUser?.is_superuser);
  const isStatisticsPage = location.pathname.startsWith('/statistics') || location.pathname.startsWith('/admin');
  const currentTab = isAdmin && isStatisticsPage ? '/statistics' : '/';

  const handleTabChange = (_event, value) => {
    navigate(value);
  };

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: { xs: 1, md: 0 } }}>
        <SchoolIcon sx={{ fontSize: 36, flexShrink: 0 }} />

        <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 260 } }}>
          <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
            Система мониторинга среднего балла ЕГЭ
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Дальневосточный федеральный университет
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            variant="standard"
            TabIndicatorProps={{
              sx: { backgroundColor: 'secondary.main', height: 3, borderRadius: 3 },
            }}
            sx={{
              minHeight: 42,
              '& .MuiTab-root': {
                minHeight: 42,
                color: 'rgba(255,255,255,0.78)',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
              },
              '& .Mui-selected': {
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <Tab icon={<HomeIcon />} iconPosition="start" label="Главная" value="/" />
            {isAdmin && (
              <Tab icon={<BarChartIcon />} iconPosition="start" label="Статистика" value="/statistics" />
            )}
          </Tabs>

          {onLogout && (
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{
                borderColor: 'rgba(255,255,255,0.45)',
                ml: { xs: 0, md: 1 },
              }}
            >
              Выйти
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
