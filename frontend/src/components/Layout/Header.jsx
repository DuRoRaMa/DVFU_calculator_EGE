import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const Header = ({ onLogout }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Система мониторинга среднего балла ЕГЭ
        </Typography>
        <Box >
          <Typography variant="body2">
            Дальневосточный федеральный университет
          </Typography>
          
        </Box>
        {onLogout && (
          <Button color="inherit" onClick={onLogout} sx={{ fontWeight: 'bold', ml: 4 }}>
            Выйти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;