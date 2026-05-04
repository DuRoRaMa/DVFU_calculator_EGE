import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { loginUser, saveAuthTokens } from '../../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormInvalid = username.trim() === '' || password.trim() === '';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isFormInvalid) {
      setError('Введите логин и пароль');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await loginUser(username, password);

      saveAuthTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });

      if (onLogin) {
        onLogin();
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
          >
            Вход
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Авторизуйтесь, чтобы перейти к калькулятору.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Логин"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            autoComplete="username"
          />

          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            sx={{ mb: 3 }}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || isFormInvalid}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
