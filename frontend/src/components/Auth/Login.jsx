import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import ErrorAlert from '../Common/ErrorAlert';
import axios from 'axios';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        username,
        password,
      });
      const accessToken = response.data.access;
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 10,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: 'white',
      }}
    >
      <h2>Вход</h2>
      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
      <TextField
        label="Username"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleLogin}
        sx={{ mt: 2 }}
      >
        Войти
      </Button>
    </Box>
  );
}