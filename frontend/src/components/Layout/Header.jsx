import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Система мониторинга среднего балла ЕГЭ
        </Typography>
        <Box>
          <Typography variant="body2">
            Дальневосточный федеральный университет
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;