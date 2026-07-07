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

  const searchParams = new URLSearchParams(location.search);
  const nextFromQuery = searchParams.get('next');

  const from = nextFromQuery || location.state?.from?.pathname || '/';

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
        user: response.data.user,
      });

      if (onLogin) {
        onLogin(response.data.user);
      }

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      console.error(err);
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" component="h1" gutterBottom>
            Вход
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Авторизуйтесь, чтобы перейти к калькулятору.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;